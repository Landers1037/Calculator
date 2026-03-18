"use client";

import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Snippet,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from "@nextui-org/react";
import {
  calculateLoanComparison,
  LoanType,
  PrepaymentStrategy,
  RepaymentMethod
} from "@/lib/loanCalculator";
import { formatCurrency } from "@/lib/format";

type FormState = {
  loanType: LoanType;
  principalFund: string;
  principalCommercial: string;
  annualRateFund: string;
  annualRateCommercial: string;
  termMonths: string;
  selectedMethod: RepaymentMethod;
  prepaymentEnabled: boolean;
  prepaymentAtMonth: string;
  prepaymentAmount: string;
  prepaymentStrategy: PrepaymentStrategy;
};

const loanTypeOptions = [
  { key: "fund", label: "公积金贷款" },
  { key: "commercial", label: "商业贷款" },
  { key: "mixed", label: "公积金 + 商贷组合贷" }
];

const methodLabel = {
  equal_principal_interest: "等额本息",
  equal_principal: "等额本金"
};

const toNumber = (value: string, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const buildMarkdown = (
  summaryRows: { metric: string; epi: string; ep: string; diff: string }[],
  selectedMethod: RepaymentMethod
) => {
  const lines = [
    "# 贷款结果对比",
    "",
    `- 用户选择还款方式：${methodLabel[selectedMethod]}`,
    "",
    "| 指标 | 等额本息 | 等额本金 | 差异（等额本息-等额本金） |",
    "| --- | ---: | ---: | ---: |"
  ];

  summaryRows.forEach((row) => {
    lines.push(`| ${row.metric} | ${row.epi} | ${row.ep} | ${row.diff} |`);
  });

  return lines.join("\n");
};

export default function HomePage() {
  const [form, setForm] = useState<FormState>({
    loanType: "mixed",
    principalFund: "600000",
    principalCommercial: "800000",
    annualRateFund: "2.85",
    annualRateCommercial: "3.95",
    termMonths: "360",
    selectedMethod: "equal_principal_interest",
    prepaymentEnabled: false,
    prepaymentAtMonth: "36",
    prepaymentAmount: "100000",
    prepaymentStrategy: "reduce_term"
  });

  const result = useMemo(
    () =>
      calculateLoanComparison({
        loanType: form.loanType,
        principalFund: toNumber(form.principalFund),
        principalCommercial: toNumber(form.principalCommercial),
        annualRateFund: toNumber(form.annualRateFund),
        annualRateCommercial: toNumber(form.annualRateCommercial),
        termMonths: Math.max(1, Math.floor(toNumber(form.termMonths, 360))),
        selectedMethod: form.selectedMethod,
        prepayment: {
          enabled: form.prepaymentEnabled,
          atMonth: Math.max(1, Math.floor(toNumber(form.prepaymentAtMonth, 1))),
          amount: Math.max(0, toNumber(form.prepaymentAmount)),
          strategy: form.prepaymentStrategy
        }
      }),
    [form]
  );

  const tableRef = useRef<HTMLDivElement>(null);
  const selected = result.selected;

  const summaryRows = [
    {
      metric: "总还款额",
      epi: formatCurrency(result.equalPrincipalInterest.totalRepayment),
      ep: formatCurrency(result.equalPrincipal.totalRepayment),
      diff: formatCurrency(result.equalPrincipalInterest.totalRepayment - result.equalPrincipal.totalRepayment)
    },
    {
      metric: "总利息",
      epi: formatCurrency(result.equalPrincipalInterest.totalInterest),
      ep: formatCurrency(result.equalPrincipal.totalInterest),
      diff: formatCurrency(result.equalPrincipalInterest.totalInterest - result.equalPrincipal.totalInterest)
    },
    {
      metric: "首月月供",
      epi: formatCurrency(result.equalPrincipalInterest.firstMonthPayment),
      ep: formatCurrency(result.equalPrincipal.firstMonthPayment),
      diff: formatCurrency(result.equalPrincipalInterest.firstMonthPayment - result.equalPrincipal.firstMonthPayment)
    },
    {
      metric: "末月月供",
      epi: formatCurrency(result.equalPrincipalInterest.lastMonthPayment),
      ep: formatCurrency(result.equalPrincipal.lastMonthPayment),
      diff: formatCurrency(result.equalPrincipalInterest.lastMonthPayment - result.equalPrincipal.lastMonthPayment)
    },
    {
      metric: "还款总月数",
      epi: `${result.equalPrincipalInterest.months} 月`,
      ep: `${result.equalPrincipal.months} 月`,
      diff: `${result.equalPrincipalInterest.months - result.equalPrincipal.months} 月`
    }
  ];

  const markdown = buildMarkdown(summaryRows, form.selectedMethod);

  const exportTableAsImage = async () => {
    if (!tableRef.current) return;
    const dataUrl = await toPng(tableRef.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "贷款对比结果.png";
    link.href = dataUrl;
    link.click();
  };

  const exportTableAsMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "贷款对比结果.md";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="grid gap-4 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-6">
      <Card className="glass border-none shadow-lg">
        <CardBody className="space-y-5 p-4 sm:p-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">现代化贷款利率计算器</h1>
            <p className="mt-1 text-sm text-slate-500">支持公积金、商贷、组合贷与提前还款模拟</p>
          </div>

          <Select
            label="贷款方式"
            selectedKeys={[form.loanType]}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as LoanType;
              setForm((prev) => ({ ...prev, loanType: key }));
            }}
          >
            {loanTypeOptions.map((item) => (
              <SelectItem key={item.key}>{item.label}</SelectItem>
            ))}
          </Select>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="公积金贷款金额 (元)"
              type="number"
              value={form.principalFund}
              onValueChange={(value) => setForm((prev) => ({ ...prev, principalFund: value }))}
              isDisabled={form.loanType === "commercial"}
            />
            <Input
              label="商贷金额 (元)"
              type="number"
              value={form.principalCommercial}
              onValueChange={(value) => setForm((prev) => ({ ...prev, principalCommercial: value }))}
              isDisabled={form.loanType === "fund"}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="公积金利率 (%)"
              type="number"
              step="0.01"
              value={form.annualRateFund}
              onValueChange={(value) => setForm((prev) => ({ ...prev, annualRateFund: value }))}
              isDisabled={form.loanType === "commercial"}
            />
            <Input
              label="商贷利率 (%)"
              type="number"
              step="0.01"
              value={form.annualRateCommercial}
              onValueChange={(value) => setForm((prev) => ({ ...prev, annualRateCommercial: value }))}
              isDisabled={form.loanType === "fund"}
            />
          </div>

          <Input
            label="贷款期限 (月)"
            type="number"
            value={form.termMonths}
            onValueChange={(value) => setForm((prev) => ({ ...prev, termMonths: value }))}
          />

          <RadioGroup
            label="用户自定义还款方式"
            value={form.selectedMethod}
            onValueChange={(value) => setForm((prev) => ({ ...prev, selectedMethod: value as RepaymentMethod }))}
          >
            <Radio value="equal_principal_interest">等额本息</Radio>
            <Radio value="equal_principal">等额本金</Radio>
          </RadioGroup>

          <div className="rounded-xl bg-slate-50 p-3">
            <Switch
              isSelected={form.prepaymentEnabled}
              onValueChange={(checked) => setForm((prev) => ({ ...prev, prepaymentEnabled: checked }))}
            >
              开启提前还款模拟
            </Switch>

            {form.prepaymentEnabled && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="提前还款时点 (第几月)"
                    type="number"
                    value={form.prepaymentAtMonth}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, prepaymentAtMonth: value }))}
                  />
                  <Input
                    label="提前还款金额 (元)"
                    type="number"
                    value={form.prepaymentAmount}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, prepaymentAmount: value }))}
                  />
                </div>
                <RadioGroup
                  label="提前还款方式"
                  value={form.prepaymentStrategy}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, prepaymentStrategy: value as PrepaymentStrategy }))
                  }
                >
                  <Radio value="reduce_term">本金不变，减少年限</Radio>
                  <Radio value="reduce_payment">本金减少，年限不变</Radio>
                </RadioGroup>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="space-y-4">
        <Card className="glass border-none shadow-lg">
          <CardBody className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">计算结果对比</h2>
                <p className="text-sm text-slate-500">展示等额本金与等额本息差异，支持导出结果</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button className="w-full sm:w-auto" color="primary" variant="flat" onPress={exportTableAsImage}>
                  导出图片
                </Button>
                <Button className="w-full sm:w-auto" color="secondary" variant="flat" onPress={exportTableAsMarkdown}>
                  导出 Markdown
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip color="primary" variant="flat">
                用户当前方案：{methodLabel[form.selectedMethod]}
              </Chip>
              <Chip color="success" variant="flat">
                预计总还款：{formatCurrency(selected.totalRepayment)}
              </Chip>
              <Chip color="warning" variant="flat">
                预计总利息：{formatCurrency(selected.totalInterest)}
              </Chip>
            </div>

            <div className="overflow-x-auto">
              <div ref={tableRef} className="min-w-[620px] rounded-xl bg-white p-3">
              <Table aria-label="贷款结果对比表">
                <TableHeader>
                  <TableColumn>指标</TableColumn>
                  <TableColumn className="text-right">等额本息</TableColumn>
                  <TableColumn className="text-right">等额本金</TableColumn>
                  <TableColumn className="text-right">差异</TableColumn>
                </TableHeader>
                <TableBody>
                  {summaryRows.map((row) => (
                    <TableRow key={row.metric}>
                      <TableCell>{row.metric}</TableCell>
                      <TableCell className="text-right">{row.epi}</TableCell>
                      <TableCell className="text-right">{row.ep}</TableCell>
                      <TableCell className="text-right font-medium text-blue-600">{row.diff}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-600">导出 Markdown 预览</p>
              <Snippet hideSymbol className="w-full overflow-x-auto whitespace-pre-wrap break-all text-xs sm:text-sm">
                {markdown}
              </Snippet>
            </div>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
