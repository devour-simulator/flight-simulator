import fs from 'node:fs';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const start = source.indexOf('const BANK_CREDIT_LIMIT');
const end = source.indexOf('\nfunction beginFlightMetrics', start);
if (start < 0 || end < 0) throw new Error('Unable to extract airline bank system');

const saved = { credits: 18000000, loanPrincipal: 0, loanInterest: 0 };
const notices = [];
const factory = new Function('saved', 'saveCareer', 'careerMarkup', 'toast', 'warningTone', '$', '$$', `${source.slice(start, end)}; return {formatMoney,totalLoanDebt,borrowFromBank,repayBank,accrueLoanInterest,BANK_CREDIT_LIMIT};`);
const bank = factory(saved, () => {}, () => {}, message => notices.push(message), () => {}, () => null, () => []);

const assert = (condition, message) => { if (!condition) throw new Error(message); };
assert(bank.formatMoney(999) === '¥999', 'Sub-thousand currency format is incorrect');
assert(bank.formatMoney(1500) === '¥1.5K', 'K currency format is incorrect');
assert(bank.formatMoney(50000000) === '¥50M', 'M currency format is incorrect');
assert(bank.formatMoney(1250000000) === '¥1.25B', 'B currency format is incorrect');
assert(bank.formatMoney(2000000000000) === '¥2T', 'T currency format is incorrect');

assert(bank.borrowFromBank(60000000) === 50000000, 'Loan must be capped at 50M');
assert(saved.loanPrincipal === 50000000 && saved.credits === 68000000, 'Loan proceeds or principal is incorrect');
assert(bank.borrowFromBank(10000000) === 0, 'Additional borrowing over the credit limit must be rejected');
assert(bank.accrueLoanInterest() === 500000, 'Per-flight interest must be 1% of principal');
assert(saved.loanInterest === 500000, 'Accrued interest was not saved');
assert(bank.repayBank(10000000) === 10000000, 'Partial repayment failed');
assert(saved.loanInterest === 0 && saved.loanPrincipal === 40500000, 'Repayment must pay interest before principal');
assert(bank.repayBank(Infinity) === 40500000 && bank.totalLoanDebt() === 0, 'Full repayment failed');

assert(source.includes("price:220000000,usedPrice:50000000"), 'Q400 new and used prices are incorrect');
assert(source.includes("saved.aircraftCondition[id]=used?72:100"), 'Used Q400 must start with reduced condition');
assert(source.includes('data.loanInterest=accrueLoanInterest()'), 'Commercial flights must accrue loan interest');
assert(source.includes('storedRecords.credits*1000'), 'Legacy credits must migrate into the new economy scale');

console.log('Q400 round 6 compact currency, aircraft market and airline bank verified');
