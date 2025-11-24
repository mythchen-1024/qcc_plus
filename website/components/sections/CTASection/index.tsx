'use client'

export default function CTASection() {
    return (
        <section className="relative w-full overflow-hidden bg-bg-secondary py-32">
            {/* 背景光效 - 移除或减弱 */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5" />

            <div className="container relative z-10 mx-auto px-4 text-center">
                <h2 className="glow-text mb-8 font-display text-6xl font-bold">
                    准备好扩展了吗？
                </h2>
                <p className="mb-12 text-2xl text-gray-300">
                    加入数千名开发者的行列，使用 QCC Plus 构建未来。
                </p>

                <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                    <a
                        href="https://github.com/yxhpy/qcc_plus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block group relative overflow-hidden rounded-lg border border-white bg-white text-black px-12 py-5 text-xl font-bold transition-all hover:bg-black hover:text-white"
                    >
                        <span className="relative z-10">立即开始</span>
                    </a>

                    <button className="rounded-lg border border-white/20 bg-white/5 px-12 py-5 text-xl font-bold backdrop-blur-sm transition-all hover:bg-white/10">
                        查看文档
                    </button>
                </div>
            </div>
        </section>
    )
}
