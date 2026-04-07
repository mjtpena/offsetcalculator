import type { Transaction } from '../types'

export function generateDemoTransactions(): Transaction[] {
  const transactions: Transaction[] = []
  const now = new Date()
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
  let balance = 45000

  const descriptions = {
    salary: 'SALARY PAYMENT - EMPLOYER PTY LTD',
    mortgage: 'HOME LOAN REPAYMENT - CBA',
    electricity: 'AGL ENERGY - DIRECT DEBIT',
    gas: 'ORIGIN ENERGY - DIRECT DEBIT',
    water: 'SYDNEY WATER - DIRECT DEBIT',
    internet: 'TELSTRA - BROADBAND',
    phone: 'OPTUS MOBILE',
    insurance: 'NRMA INSURANCE - PREMIUM',
    healthInsurance: 'MEDIBANK PRIVATE',
    groceries: ['WOOLWORTHS', 'COLES SUPERMARKET', 'ALDI STORES', 'HARRIS FARM MARKETS'],
    dining: ['UBER EATS', 'MENULOG', 'THAI GARDEN RESTAURANT', 'DOMINOS PIZZA', 'CAFE SOCIETY'],
    fuel: ['BP SERVICE STATION', 'SHELL COLES EXPRESS', '7-ELEVEN FUEL'],
    shopping: ['AMAZON AU', 'KMART', 'TARGET', 'BUNNINGS WAREHOUSE', 'JB HI-FI'],
    entertainment: ['NETFLIX', 'SPOTIFY', 'HOYTS CINEMAS', 'TICKETMASTER'],
    transport: ['OPAL CARD TOP UP', 'UBER TRIP'],
    medical: ['CHEMIST WAREHOUSE', 'PRICELINE PHARMACY'],
    transfer: ['TRANSFER TO SAVINGS', 'BPAY - COUNCIL RATES'],
  }

  let payday = new Date(startDate)
  payday.setDate(15)
  if (payday < startDate) payday.setMonth(payday.getMonth() + 1)

  // Generate fortnightly salary dates
  const salaryDates: Date[] = []
  const salaryStart = new Date(payday)
  while (salaryStart <= now) {
    salaryDates.push(new Date(salaryStart))
    salaryStart.setDate(salaryStart.getDate() + 14)
  }

  // Pre-generate all transactions for sorting
  const rawTxns: { date: Date; description: string; amount: number }[] = []

  // Salary - fortnightly ~$4,500
  for (const sd of salaryDates) {
    const variation = (Math.random() - 0.5) * 100
    rawTxns.push({ date: new Date(sd), description: descriptions.salary, amount: 4500 + variation })
  }

  // Monthly mortgage payment ~$3,200
  for (let m = 0; m < 12; m++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
    rawTxns.push({ date: d, description: descriptions.mortgage, amount: -(3180 + Math.random() * 40) })
  }

  // Monthly bills
  for (let m = 0; m < 12; m++) {
    const month = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)

    // Electricity - quarterly
    if (m % 3 === 0) {
      rawTxns.push({
        date: addDays(month, 10 + Math.floor(Math.random() * 5)),
        description: descriptions.electricity,
        amount: -(280 + Math.random() * 120),
      })
    }

    // Gas - quarterly
    if (m % 3 === 1) {
      rawTxns.push({
        date: addDays(month, 12 + Math.floor(Math.random() * 5)),
        description: descriptions.gas,
        amount: -(80 + Math.random() * 60),
      })
    }

    // Water - quarterly
    if (m % 3 === 2) {
      rawTxns.push({
        date: addDays(month, 8 + Math.floor(Math.random() * 5)),
        description: descriptions.water,
        amount: -(180 + Math.random() * 80),
      })
    }

    // Internet - monthly
    rawTxns.push({
      date: addDays(month, 5),
      description: descriptions.internet,
      amount: -89.99,
    })

    // Phone - monthly
    rawTxns.push({
      date: addDays(month, 18),
      description: descriptions.phone,
      amount: -65,
    })

    // Insurance - monthly
    rawTxns.push({
      date: addDays(month, 20),
      description: descriptions.insurance,
      amount: -(185 + Math.random() * 10),
    })

    // Health insurance - monthly
    rawTxns.push({
      date: addDays(month, 22),
      description: descriptions.healthInsurance,
      amount: -(320 + Math.random() * 10),
    })
  }

  // Weekly groceries
  const groceryStart = new Date(startDate)
  while (groceryStart <= now) {
    const store = descriptions.groceries[Math.floor(Math.random() * descriptions.groceries.length)]
    rawTxns.push({
      date: new Date(groceryStart),
      description: store,
      amount: -(120 + Math.random() * 130),
    })
    // Sometimes a second smaller shop mid-week
    if (Math.random() > 0.5) {
      const midWeek = addDays(new Date(groceryStart), 3 + Math.floor(Math.random() * 2))
      if (midWeek <= now) {
        rawTxns.push({
          date: midWeek,
          description: descriptions.groceries[Math.floor(Math.random() * descriptions.groceries.length)],
          amount: -(30 + Math.random() * 60),
        })
      }
    }
    groceryStart.setDate(groceryStart.getDate() + 7)
  }

  // Dining out - 3-5 times per month
  for (let m = 0; m < 12; m++) {
    const month = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
    const monthIdx = month.getMonth()
    const diningCount = monthIdx === 11 ? 7 : 3 + Math.floor(Math.random() * 3) // More in Dec
    for (let i = 0; i < diningCount; i++) {
      const venue = descriptions.dining[Math.floor(Math.random() * descriptions.dining.length)]
      rawTxns.push({
        date: addDays(month, Math.floor(Math.random() * 28)),
        description: venue,
        amount: -(25 + Math.random() * 75),
      })
    }
  }

  // Fuel - fortnightly
  for (let m = 0; m < 12; m++) {
    const month = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
    rawTxns.push({
      date: addDays(month, 3 + Math.floor(Math.random() * 5)),
      description: descriptions.fuel[Math.floor(Math.random() * descriptions.fuel.length)],
      amount: -(65 + Math.random() * 40),
    })
    rawTxns.push({
      date: addDays(month, 17 + Math.floor(Math.random() * 5)),
      description: descriptions.fuel[Math.floor(Math.random() * descriptions.fuel.length)],
      amount: -(65 + Math.random() * 40),
    })
  }

  // Shopping - 2-4 times per month, higher in Dec
  for (let m = 0; m < 12; m++) {
    const month = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
    const monthIdx = month.getMonth()
    const shopCount = monthIdx === 11 ? 6 : 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < shopCount; i++) {
      const store = descriptions.shopping[Math.floor(Math.random() * descriptions.shopping.length)]
      const amount = monthIdx === 11
        ? -(50 + Math.random() * 300) // Higher Dec spending
        : -(30 + Math.random() * 150)
      rawTxns.push({
        date: addDays(month, Math.floor(Math.random() * 28)),
        description: store,
        amount,
      })
    }
  }

  // Entertainment subscriptions + occasional events
  for (let m = 0; m < 12; m++) {
    const month = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
    rawTxns.push({ date: addDays(month, 1), description: 'NETFLIX', amount: -22.99 })
    rawTxns.push({ date: addDays(month, 1), description: 'SPOTIFY', amount: -12.99 })
    if (Math.random() > 0.6) {
      rawTxns.push({
        date: addDays(month, 10 + Math.floor(Math.random() * 15)),
        description: descriptions.entertainment[Math.floor(Math.random() * descriptions.entertainment.length)],
        amount: -(20 + Math.random() * 80),
      })
    }
  }

  // Transport
  for (let m = 0; m < 12; m++) {
    const month = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
    rawTxns.push({
      date: addDays(month, 7),
      description: 'OPAL CARD TOP UP',
      amount: -50,
    })
    if (Math.random() > 0.5) {
      rawTxns.push({
        date: addDays(month, 15 + Math.floor(Math.random() * 10)),
        description: 'UBER TRIP',
        amount: -(15 + Math.random() * 35),
      })
    }
  }

  // Occasional medical
  for (let m = 0; m < 12; m++) {
    if (Math.random() > 0.7) {
      const month = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
      rawTxns.push({
        date: addDays(month, Math.floor(Math.random() * 28)),
        description: descriptions.medical[Math.floor(Math.random() * descriptions.medical.length)],
        amount: -(15 + Math.random() * 85),
      })
    }
  }

  // Council rates - quarterly
  for (let q = 0; q < 4; q++) {
    const month = new Date(startDate.getFullYear(), startDate.getMonth() + q * 3, 1)
    rawTxns.push({
      date: addDays(month, 25),
      description: 'BPAY - COUNCIL RATES',
      amount: -(450 + Math.random() * 50),
    })
  }

  // Sort by date
  rawTxns.sort((a, b) => a.date.getTime() - b.date.getTime())

  // Build transactions with running balance
  for (const txn of rawTxns) {
    if (txn.date > now) continue
    balance = Math.round((balance + txn.amount) * 100) / 100
    // Keep balance realistic (don't go below 5k in this demo)
    if (balance < 5000) balance = 5000 + Math.random() * 2000

    transactions.push({
      date: txn.date.toISOString().split('T')[0],
      description: txn.description,
      amount: Math.round(txn.amount * 100) / 100,
      runningBalance: balance,
    })
  }

  return transactions
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
