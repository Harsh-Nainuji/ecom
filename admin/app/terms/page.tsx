import React from 'react';

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
      <div>
        <h2 className="text-[28px] font-bold text-slate-900 editorial-header tracking-tight">Terms & Privacy Policy</h2>
        <p className="text-sm text-slate-500 mt-1">Platform rules, guidelines, compliance, and privacy conditions.</p>
      </div>

      <hr className="border-slate-100" />

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-slate-800">Terms of Service</h3>
          <span className="text-xs font-semibold text-rose-500">[Policy content pending from client]</span>
          <p className="text-sm leading-relaxed text-slate-600">
            Welcome to FabZone. These Terms of Service ("Terms") govern your access to and use of our mobile application and services. By accessing or using our services, you agree to be bound by these Terms and our Privacy Policy.
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            We reserve the right to modify these terms at any time. Your continued use of the platform constitutes agreement to any updated terms.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-slate-800">Privacy Policy</h3>
          <span className="text-xs font-semibold text-rose-500">[Policy content pending from client]</span>
          <p className="text-sm leading-relaxed text-slate-600">
            We value your privacy. We collect personal data such as your name, phone number, email address, and shipping address to fulfill your orders and process payments. We do not sell or share your personal information with third parties except as required to provide services (e.g. Supabase, Razorpay) or as legally required.
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            You may request access to, correction of, or deletion of your personal data by contacting our support team.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-slate-800">Refund and Cancellation Policy</h3>
          <span className="text-xs font-semibold text-rose-500">[Policy content pending from client]</span>
          <p className="text-sm leading-relaxed text-slate-600">
            Orders can be cancelled before they are processed. Refund processing timeframes vary depending on the payment provider. Returns are subject to a 7-day window under specified conditions.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-slate-800">Shipping Policy</h3>
          <span className="text-xs font-semibold text-rose-500">[Policy content pending from client]</span>
          <p className="text-sm leading-relaxed text-slate-600">
            Products are shipped directly by their respective sellers. Expected delivery timeframes are typically 3-5 business days from order confirmation. Shipping fees are calculated at checkout.
          </p>
        </section>
      </div>
    </div>
  );
}
