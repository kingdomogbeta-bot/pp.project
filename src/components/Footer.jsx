import React from 'react'

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Blog', href: '/blog' },
]

const supportLinks = [
  { label: 'Help Center', href: '/help' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns', href: '/returns' },
]

export default function Footer({ storeSettings = {} }) {
  const storeName = storeSettings.storeName || 'Horizon'
  const storeAddress = storeSettings.storeAddress || '123 Market St, Suite 100'
  const storeEmail = storeSettings.storeEmail || 'admin@store.com'
  
  function handleSubscribe() {
    try {
      const el = document.getElementById('footer-email')
      const val = el && el.value ? el.value.trim() : ''
      if (!val) return alert('Please provide an email to subscribe')
      // Placeholder behaviour: developer can replace with real submit
      alert('Subscribed: ' + val)
      if (el) el.value = ''
    } catch (e) {
      console.error('subscribe failed', e)
    }
  }

  return (
    <footer className="border-t border-blue-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 dark:bg-gray-900 text-gray-700 dark:text-gray-300 mt-12 w-full overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">{storeName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Premium curated products with thoughtful service — trusted by thousands.</p>
            <address className="not-italic text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} {storeName} • {storeAddress}</address>
          </div>

          <nav aria-label="Company" className="text-sm">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 border-b-2 border-blue-500 pb-2">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-blue-600 dark:hover:text-blue-300 text-gray-600 dark:text-gray-300 transition">{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Support" className="text-sm">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 border-b-2 border-indigo-500 pb-2">Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-indigo-600 dark:hover:text-indigo-300 text-gray-600 dark:text-gray-300 transition">{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="text-sm">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Stay in touch</h4>
            <p className="text-gray-600 dark:text-gray-300 mb-3">Subscribe to product news and occasional offers.</p>
            <form className="flex flex-col" onSubmit={(e) => e.preventDefault()} aria-label="Subscribe form">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input id="footer-email" type="email" placeholder="you@company.com" className="h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="mt-3">
                <button onClick={handleSubscribe} type="button" className="w-full h-10 px-4 rounded-lg bg-gray-900 text-white hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 font-medium transition text-sm">Subscribe</button>
              </div>
            </form>

            <div className="flex items-center gap-3 mt-4">
              <a href="https://twitter.com" aria-label="Twitter" className="text-gray-600 hover:text-gray-900 dark:hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 5.92c-.63.28-1.31.47-2.02.55.73-.44 1.29-1.13 1.55-1.95-.68.4-1.43.7-2.23.86A3.47 3.47 0 0016.5 4c-1.92 0-3.48 1.58-3.48 3.53 0 .28.03.55.09.81-2.9-.14-5.48-1.58-7.2-3.77-.3.52-.47 1.12-.47 1.76 0 1.22.63 2.3 1.59 2.93-.58-.02-1.13-.18-1.61-.44v.04c0 1.7 1.2 3.12 2.8 3.44-.29.07-.6.11-.92.11-.22 0-.44-.02-.65-.06.44 1.35 1.72 2.33 3.24 2.36A6.98 6.98 0 012 19.54 9.82 9.82 0 007.29 21c6.05 0 9.36-5.07 9.36-9.46v-.43c.64-.46 1.2-1.04 1.63-1.69-.58.26-1.2.44-1.83.52z"/></svg>
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="text-gray-600 hover:text-gray-900 dark:hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8.34 17H6.21V10.5h2.13V17zM7.27 9.48a1.23 1.23 0 110-2.46 1.23 1.23 0 010 2.46zM18 17h-2.13v-3.2c0-.76-.02-1.73-1.05-1.73-1.05 0-1.21.82-1.21 1.66V17H11.5V10.5h2.04v.88h.03c.28-.53.97-1.09 2-1.09 2.14 0 2.53 1.41 2.53 3.24V17z"/></svg>
              </a>
              <a href="/" aria-label="GitHub" className="text-gray-600 hover:text-gray-900 dark:hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.73.5.5 5.73.5 12.02c0 5.12 3.29 9.46 7.86 10.99.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.21 1.78 1.21 1.04 1.78 2.72 1.26 3.38.96.11-.75.41-1.26.74-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.06 11.06 0 012.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.68.42.36.8 1.07.8 2.16 0 1.56-.01 2.82-.01 3.21 0 .31.21.68.8.56A10.52 10.52 0 0023.5 12c0-6.29-5.23-11.5-11.5-11.5z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6 text-sm text-gray-600 dark:text-gray-300 flex flex-col md:flex-row items-center justify-between gap-3">
          <p>Made with care • <a href="/privacy" className="underline hover:text-blue-600 dark:hover:text-blue-300">Privacy</a> • <a href="/terms" className="underline hover:text-blue-600 dark:hover:text-blue-300">Terms</a></p>
          <p className="ml-auto">All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
