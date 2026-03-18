export type LoanType = "fund" | "commercial" | "mixed";
export type RepaymentMethod = "equal_principal_interest" | "equal_principal";
export type PrepaymentStrategy = "reduce_term" | "reduce_payment";

export type PrepaymentOption = {
  enabled: boolean;
  atMonth: number;
  amount: number;
  strategy: PrepaymentStrategy;
};

export type LoanInput = {
  loanType: LoanType;
  principalFund: number;
  principalCommercial: number;
  annualRateFund: number;
  annualRateCommercial: number;
  termMonths: number;
  selectedMethod: RepaymentMethod;
  prepayment: PrepaymentOption;
};

export type ScheduleItem = {
  month: number;
  regularPayment: number;
  interest: number;
  principal: number;
  extraPayment: number;
  remainingPrincipal: number;
};

export type LoanResult = {
  method: RepaymentMethod;
  schedule: ScheduleItem[];
  totalInterest: number;
  totalRepayment: number;
  totalPrincipal: number;
  months: number;
  firstMonthPayment: number;
  lastMonthPayment: number;
};

export type LoanComparison = {
  input: LoanInput;
  equalPrincipalInterest: LoanResult;
  equalPrincipal: LoanResult;
  selected: LoanResult;
};

const EPS = 1e-6;

const round2 = (value: number) => Math.round(value * 100) / 100;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const calcEMI = (principal: number, monthlyRate: number, months: number) => {
  if (months <= 0 || principal <= 0) return 0;
  if (Math.abs(monthlyRate) < EPS) return principal / months;
  const pow = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * pow) / (pow - 1);
};

const normalizeInput = (input: LoanInput): LoanInput => {
  const termMonths = Math.max(1, Math.floor(input.termMonths));
  const principalFund = Math.max(0, input.principalFund);
  const principalCommercial = Math.max(0, input.principalCommercial);
  const annualRateFund = Math.max(0, input.annualRateFund);
  const annualRateCommercial = Math.max(0, input.annualRateCommercial);
  const prepaymentAmount = Math.max(0, input.prepayment.amount);
  const atMonth = clamp(Math.floor(input.prepayment.atMonth), 1, termMonths);
  return {
    ...input,
    termMonths,
    principalFund,
    principalCommercial,
    annualRateFund,
    annualRateCommercial,
    prepayment: {
      ...input.prepayment,
      amount: prepaymentAmount,
      atMonth
    }
  };
};

const calcSinglePart = (
  principal: number,
  annualRate: number,
  termMonths: number,
  method: RepaymentMethod,
  prepayment: PrepaymentOption
): LoanResult => {
  if (principal <= 0) {
    return {
      method,
      schedule: [],
      totalInterest: 0,
      totalRepayment: 0,
      totalPrincipal: 0,
      months: 0,
      firstMonthPayment: 0,
      lastMonthPayment: 0
    };
  }

  const monthlyRate = annualRate / 12 / 100;
  let month = 1;
  let remaining = principal;
  let monthlyPayment = calcEMI(principal, monthlyRate, termMonths);
  let monthlyPrincipal = termMonths > 0 ? principal / termMonths : principal;
  const schedule: ScheduleItem[] = [];

  while (remaining > EPS && month <= 1000) {
    const paidMonths = month - 1;
    const remainingMonths = Math.max(termMonths - paidMonths, 1);
    const interest = remaining * monthlyRate;
    let principalPay = 0;
    let regularPayment = 0;

    if (method === "equal_principal_interest") {
      regularPayment = monthlyPayment;
      principalPay = regularPayment - interest;
      if (principalPay > remaining) {
        principalPay = remaining;
        regularPayment = principalPay + interest;
      }
    } else {
      principalPay = Math.min(monthlyPrincipal, remaining);
      regularPayment = principalPay + interest;
    }

    remaining = Math.max(0, remaining - principalPay);
    let extraPayment = 0;

    if (prepayment.enabled && month === prepayment.atMonth && prepayment.amount > 0 && remaining > EPS) {
      extraPayment = Math.min(prepayment.amount, remaining);
      remaining = Math.max(0, remaining - extraPayment);

      if (remaining > EPS) {
        if (prepayment.strategy === "reduce_payment") {
          const nextRemainingMonths = Math.max(termMonths - month, 1);
          if (method === "equal_principal_interest") {
            monthlyPayment = calcEMI(remaining, monthlyRate, nextRemainingMonths);
          } else {
            monthlyPrincipal = remaining / nextRemainingMonths;
          }
        }
      }
    }

    schedule.push({
      month,
      regularPayment: round2(regularPayment),
      interest: round2(interest),
      principal: round2(principalPay),
      extraPayment: round2(extraPayment),
      remainingPrincipal: round2(remaining)
    });

    month += 1;
  }

  const totalInterest = round2(schedule.reduce((sum, item) => sum + item.interest, 0));
  const totalRepayment = round2(
    schedule.reduce((sum, item) => sum + item.regularPayment + item.extraPayment, 0)
  );
  const firstMonthPayment = schedule.length ? round2(schedule[0].regularPayment + schedule[0].extraPayment) : 0;
  const lastMonthPayment = schedule.length
    ? round2(schedule[schedule.length - 1].regularPayment + schedule[schedule.length - 1].extraPayment)
    : 0;

  return {
    method,
    schedule,
    totalInterest,
    totalRepayment,
    totalPrincipal: round2(principal),
    months: schedule.length,
    firstMonthPayment,
    lastMonthPayment
  };
};

const mergeSchedules = (a: ScheduleItem[], b: ScheduleItem[]) => {
  const size = Math.max(a.length, b.length);
  const merged: ScheduleItem[] = [];

  for (let index = 0; index < size; index += 1) {
    const left = a[index];
    const right = b[index];
    merged.push({
      month: index + 1,
      regularPayment: round2((left?.regularPayment ?? 0) + (right?.regularPayment ?? 0)),
      interest: round2((left?.interest ?? 0) + (right?.interest ?? 0)),
      principal: round2((left?.principal ?? 0) + (right?.principal ?? 0)),
      extraPayment: round2((left?.extraPayment ?? 0) + (right?.extraPayment ?? 0)),
      remainingPrincipal: round2((left?.remainingPrincipal ?? 0) + (right?.remainingPrincipal ?? 0))
    });
  }

  return merged;
};

const sumResult = (method: RepaymentMethod, schedule: ScheduleItem[], principal: number): LoanResult => {
  const totalInterest = round2(schedule.reduce((sum, item) => sum + item.interest, 0));
  const totalRepayment = round2(schedule.reduce((sum, item) => sum + item.regularPayment + item.extraPayment, 0));
  const firstMonthPayment = schedule.length ? round2(schedule[0].regularPayment + schedule[0].extraPayment) : 0;
  const lastMonthPayment = schedule.length
    ? round2(schedule[schedule.length - 1].regularPayment + schedule[schedule.length - 1].extraPayment)
    : 0;

  return {
    method,
    schedule,
    totalInterest,
    totalRepayment,
    totalPrincipal: round2(principal),
    months: schedule.length,
    firstMonthPayment,
    lastMonthPayment
  };
};

const calcMethod = (input: LoanInput, method: RepaymentMethod): LoanResult => {
  const principal = input.principalFund + input.principalCommercial;
  if (input.loanType === "fund") {
    return calcSinglePart(input.principalFund, input.annualRateFund, input.termMonths, method, input.prepayment);
  }
  if (input.loanType === "commercial") {
    return calcSinglePart(
      input.principalCommercial,
      input.annualRateCommercial,
      input.termMonths,
      method,
      input.prepayment
    );
  }

  const fundTotal = principal > EPS ? (input.principalFund / principal) * input.prepayment.amount : 0;
  const commercialTotal = principal > EPS ? (input.principalCommercial / principal) * input.prepayment.amount : 0;
  const fundResult = calcSinglePart(input.principalFund, input.annualRateFund, input.termMonths, method, {
    ...input.prepayment,
    amount: fundTotal
  });
  const commercialResult = calcSinglePart(
    input.principalCommercial,
    input.annualRateCommercial,
    input.termMonths,
    method,
    {
      ...input.prepayment,
      amount: commercialTotal
    }
  );
  const merged = mergeSchedules(fundResult.schedule, commercialResult.schedule);
  return sumResult(method, merged, principal);
};

export const calculateLoanComparison = (rawInput: LoanInput): LoanComparison => {
  const input = normalizeInput(rawInput);
  const equalPrincipalInterest = calcMethod(input, "equal_principal_interest");
  const equalPrincipal = calcMethod(input, "equal_principal");
  const selected =
    input.selectedMethod === "equal_principal_interest" ? equalPrincipalInterest : equalPrincipal;

  return {
    input,
    equalPrincipalInterest,
    equalPrincipal,
    selected
  };
};
