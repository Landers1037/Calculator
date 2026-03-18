export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl">
      <div className="glass space-y-6 rounded-2xl p-6 shadow-lg sm:p-8">
          <section>
            <h1 className="text-2xl font-bold text-slate-900">关于贷款计算算法</h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              本站按照中国常见房贷计算口径，对公积金贷款、商业贷款与组合贷款进行月度现金流模拟。核心算法已提取为独立模块，可复用在页面与其他系统中。
            </p>
          </section>

          <hr className="border-slate-200" />

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">1. 基础输入与贷款类型</h2>
            <p className="text-sm leading-7 text-slate-600">
              用户可输入公积金本金、商贷本金、对应年化利率、贷款总期数（月）。若选择组合贷，系统会分别计算两部分，再按每月还款项进行合并。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">2. 等额本息（按月固定月供）</h2>
            <p className="text-sm leading-7 text-slate-600">
              月利率 r = 年利率 / 12。月供 M = P × r × (1+r)^n / ((1+r)^n - 1)。其中 P 为本金，n 为总月数。每月利息 = 剩余本金 × r，本金 = 月供
              - 利息。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">3. 等额本金（按月固定本金）</h2>
            <p className="text-sm leading-7 text-slate-600">
              每月归还本金 = P / n。每月利息 = 当月剩余本金 × r。每月月供 = 当月本金 + 当月利息。由于本金逐月下降，等额本金的月供会逐月递减。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">4. 提前还款模拟</h2>
            <p className="text-sm leading-7 text-slate-600">
              支持在第 m 月追加提前还款金额 A，并提供两种策略：本金不变减少年限、或本金减少年限不变。系统在提前还款后，按所选策略重算剩余还款计划并汇总总还款与总利息。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">5. 结果对比维度</h2>
            <p className="text-sm leading-7 text-slate-600">
              输出总还款额、总利息、首月月供、末月月供与还款总月数，并以表格展示等额本息和等额本金差异。结果可导出为图片和 Markdown，便于留档或沟通。
            </p>
          </section>
      </div>
    </main>
  );
}
