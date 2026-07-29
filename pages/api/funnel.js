// pages/api/funnel.js
// Fetches live data from GHL (Meta leads) and HCP (jobs/estimates)
// and returns a unified funnel breakdown by source.

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const HCP_API_KEY = process.env.HCP_API_KEY;

function normalizePhone(p = '') {
  return p.replace(/\D/g, '').slice(-10);
}

// --- GHL ---
async function fetchGHLContacts() {
  const contacts = [];
  let cursor = null;

  do {
    const url = new URL('https://services.leadconnectorhq.com/contacts/');
    url.searchParams.set('locationId', GHL_LOCATION_ID);
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('startAfter', cursor);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: '2021-07-28',
      },
    });
    const data = await res.json();
    const batch = data.contacts || [];
    contacts.push(...batch);
    cursor = data.meta?.startAfter || null;
  } while (cursor);

  return contacts;
}

// --- HCP ---
async function fetchHCPAll(endpoint) {
  const items = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.housecallpro.com/${endpoint}?page=${page}&page_size=100`,
      { headers: { Authorization: `Token ${HCP_API_KEY}` } }
    );
    const data = await res.json();
    const batch = data[endpoint] || data.results || [];
    if (!batch.length) break;
    items.push(...batch);
    if (!data.next_page) break;
    page++;
  }

  return items;
}

export default async function handler(req, res) {
  try {
    // Fetch all data in parallel
    const [ghlContacts, hcpCustomers, hcpJobs] = await Promise.all([
      fetchGHLContacts(),
      fetchHCPAll('customers'),
      fetchHCPAll('jobs'),
    ]);

    // --- Build HCP lookups ---
    const hcpByPhone = {};
    const hcpByEmail = {};

    for (const c of hcpCustomers) {
      const phones = [c.mobile_number, c.home_number, c.work_number];
      for (const p of phones) {
        const norm = normalizePhone(p || '');
        if (norm.length === 10) hcpByPhone[norm] = c;
      }
      if (c.email) hcpByEmail[c.email.toLowerCase().trim()] = c;
    }

    // Map HCP customer id → jobs
    const jobsByCustomer = {};
    for (const job of hcpJobs) {
      const cid = job.customer?.id;
      if (!cid) continue;
      if (!jobsByCustomer[cid]) jobsByCustomer[cid] = [];
      jobsByCustomer[cid].push(job);
    }

    // --- Match GHL Meta leads → HCP ---
    const metaLeads = ghlContacts.filter(c =>
      (c.tags || []).some(t => t.toLowerCase().includes('meta'))
    );

    let metaInHCP = 0;
    let metaEstimateBooked = 0;
    let metaEstimateApproved = 0;
    let metaRevenue = 0;

    const metaDetails = metaLeads.map(contact => {
      const phone = normalizePhone(contact.phone || '');
      const email = (contact.email || '').toLowerCase().trim();

      const hcpMatch =
        (phone.length === 10 && hcpByPhone[phone]) ||
        (email && hcpByEmail[email]) ||
        null;

      let bookedEstimate = false;
      let approvedEstimate = false;
      let revenue = 0;
      let jobStatuses = [];

      if (hcpMatch) {
        metaInHCP++;
        const jobs = jobsByCustomer[hcpMatch.id] || [];
        jobStatuses = jobs.map(j => j.work_status || j.status || '');

        for (const job of jobs) {
          const status = (job.work_status || job.status || '').toLowerCase();
          if (['estimate', 'scheduled', 'in_progress', 'complete', 'approved'].includes(status)) {
            bookedEstimate = true;
          }
          if (['approved', 'complete', 'in_progress'].includes(status)) {
            approvedEstimate = true;
          }
          revenue += parseFloat(job.total_amount || job.invoice_amount || 0);
        }

        if (bookedEstimate) metaEstimateBooked++;
        if (approvedEstimate) metaEstimateApproved++;
        metaRevenue += revenue;
      }

      return {
        name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        phone: contact.phone,
        email: contact.email,
        createdAt: contact.dateAdded,
        inHCP: !!hcpMatch,
        hcpName: hcpMatch ? `${hcpMatch.first_name} ${hcpMatch.last_name}` : null,
        bookedEstimate,
        approvedEstimate,
        revenue,
        jobStatuses,
      };
    });

    // --- LSA funnel (from HCP lead source tagging if available) ---
    // HCP doesn't tag lead source reliably, so we count customers NOT matched
    // from GHL as potential LSA/other-source customers
    const ghlPhones = new Set(
      metaLeads.map(c => normalizePhone(c.phone || '')).filter(p => p.length === 10)
    );
    const ghlEmails = new Set(
      metaLeads.map(c => (c.email || '').toLowerCase()).filter(Boolean)
    );

    const nonMetaCustomers = hcpCustomers.filter(c => {
      const phones = [c.mobile_number, c.home_number, c.work_number];
      const matchPhone = phones.some(p => {
        const n = normalizePhone(p || '');
        return n.length === 10 && ghlPhones.has(n);
      });
      const matchEmail = ghlEmails.has((c.email || '').toLowerCase());
      return !matchPhone && !matchEmail;
    });

    let lsaEstimateBooked = 0;
    let lsaEstimateApproved = 0;
    let lsaRevenue = 0;

    for (const c of nonMetaCustomers) {
      const jobs = jobsByCustomer[c.id] || [];
      for (const job of jobs) {
        const status = (job.work_status || job.status || '').toLowerCase();
        if (['estimate', 'scheduled', 'in_progress', 'complete', 'approved'].includes(status)) {
          lsaEstimateBooked++;
          break;
        }
      }
      for (const job of jobs) {
        const status = (job.work_status || job.status || '').toLowerCase();
        if (['approved', 'complete', 'in_progress'].includes(status)) {
          lsaEstimateApproved++;
          break;
        }
      }
      for (const job of jobs) {
        lsaRevenue += parseFloat(job.total_amount || job.invoice_amount || 0);
      }
    }

    res.status(200).json({
      meta: {
        totalLeads: metaLeads.length,
        inHCP: metaInHCP,
        estimateBooked: metaEstimateBooked,
        estimateApproved: metaEstimateApproved,
        revenue: metaRevenue,
        details: metaDetails,
      },
      lsa: {
        totalLeads: null, // LSA lead count requires separate LSA export
        inHCP: nonMetaCustomers.length,
        estimateBooked: lsaEstimateBooked,
        estimateApproved: lsaEstimateApproved,
        revenue: lsaRevenue,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
