'use client'

export default function PricingSection() {
    return (
        <section className="relative min-h-screen w-full bg-bg-tertiary py-20">
            <div className="container mx-auto px-4">
                <h2 className="glow-text mb-16 text-center font-display text-5xl font-bold">
                    Simple Pricing
                </h2>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* Starter */}
                    <div className="glass rounded-lg p-8 transition-transform hover:scale-105">
                        <h3 className="mb-4 text-2xl font-bold text-white">Starter</h3>
                        <div className="mb-6 text-4xl font-bold text-quantum-blue">
                            $0<span className="text-lg text-gray-400">/mo</span>
                        </div>
                        <ul className="mb-8 space-y-4 text-gray-300">
                            <li className="flex items-center gap-2">✓ 10k Requests/mo</li>
                            <li className="flex items-center gap-2">✓ Community Support</li>
                            <li className="flex items-center gap-2">✓ Basic Analytics</li>
                        </ul>
                        <button className="w-full rounded-lg border border-quantum-blue py-3 font-bold text-quantum-blue transition-colors hover:bg-quantum-blue hover:text-white">
                            Start Free
                        </button>
                    </div>

                    {/* Pro */}
                    <div className="glass relative rounded-lg border-quantum-purple p-8 transition-transform hover:scale-105">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-quantum-purple px-4 py-1 text-sm font-bold text-white">
                            POPULAR
                        </div>
                        <h3 className="mb-4 text-2xl font-bold text-white">Pro</h3>
                        <div className="mb-6 text-4xl font-bold text-quantum-purple">
                            $49<span className="text-lg text-gray-400">/mo</span>
                        </div>
                        <ul className="mb-8 space-y-4 text-gray-300">
                            <li className="flex items-center gap-2">✓ 1M Requests/mo</li>
                            <li className="flex items-center gap-2">✓ Priority Support</li>
                            <li className="flex items-center gap-2">✓ Advanced Analytics</li>
                            <li className="flex items-center gap-2">✓ Custom Domains</li>
                        </ul>
                        <button className="w-full rounded-lg bg-gradient-to-r from-quantum-blue to-quantum-purple py-3 font-bold text-white transition-opacity hover:opacity-90">
                            Get Pro
                        </button>
                    </div>

                    {/* Enterprise */}
                    <div className="glass rounded-lg p-8 transition-transform hover:scale-105">
                        <h3 className="mb-4 text-2xl font-bold text-white">Enterprise</h3>
                        <div className="mb-6 text-4xl font-bold text-quantum-green">
                            Custom
                        </div>
                        <ul className="mb-8 space-y-4 text-gray-300">
                            <li className="flex items-center gap-2">✓ Unlimited Requests</li>
                            <li className="flex items-center gap-2">✓ 24/7 Dedicated Support</li>
                            <li className="flex items-center gap-2">✓ SLA Guarantee</li>
                            <li className="flex items-center gap-2">✓ On-premise Deployment</li>
                        </ul>
                        <button className="w-full rounded-lg border border-quantum-green py-3 font-bold text-quantum-green transition-colors hover:bg-quantum-green hover:text-white">
                            Contact Sales
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
