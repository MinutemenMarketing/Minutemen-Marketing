// Contact details and keys. Every empty value is TODO(client): whatever is empty stays hidden on
// the site (the item is not rendered). Fill these in and redeploy; nothing else needs editing.
export const SITE = {
  // Web3Forms access key (public by design; it only lets the form send to minutemenmrktng@gmail.com).
  web3formsKey: '604c47c1-7174-4a58-9f16-208aae0efd14',
  workEmail: 'minutemenmrktng@gmail.com',
  otherEmail: '', // TODO(client)
  phone: '(631) 882-8022', // shown as written; links as tel:+16318828022
  instagram: '', // TODO(client): full URL
  linkedin: 'https://www.linkedin.com/company/minutemen-marketing', // company page (footer, Contact)
  // Founder LinkedIn profiles: a small icon link on each founder card; empty = hidden.
  founders: {
    noah: { linkedin: '' }, // TODO(client): Noah's LinkedIn URL
    ethan: { linkedin: 'https://www.linkedin.com/in/ethan-eghbali/' },
  },
  other: [], // TODO(client): [{ label: 'Facebook', url: 'https://…' }]
  // Web Analytics is enabled in Vercel (2026-11-06).
  vercelAnalytics: true,
};
