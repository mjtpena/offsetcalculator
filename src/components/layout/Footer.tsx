export function Footer() {
  return (
    <footer className="bg-surface-dark text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-3">OffsetIQ</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Show your clients what their offset is actually doing. Built by Datachain Consulting.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="hover:text-slate-300 transition-colors cursor-pointer">Offset Calculator</li>
              <li className="hover:text-slate-300 transition-colors cursor-pointer">Statement Import</li>
              <li className="hover:text-slate-300 transition-colors cursor-pointer">Interest Analysis</li>
              <li className="hover:text-slate-300 transition-colors cursor-pointer">Forward Projections</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">For Brokers</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="hover:text-slate-300 transition-colors cursor-pointer">Starter — $99/mo</li>
              <li className="hover:text-slate-300 transition-colors cursor-pointer">Team — $249/mo</li>
              <li className="hover:text-slate-300 transition-colors cursor-pointer">Practice — $499/mo</li>
              <li className="hover:text-slate-300 transition-colors cursor-pointer">Enterprise — Custom</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Datachain Consulting Pty Ltd. All rights reserved.</p>
          <p className="mt-2">This tool is for general information and educational purposes only. It does not constitute financial advice.</p>
        </div>
      </div>
    </footer>
  )
}
