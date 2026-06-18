import type { PLData } from "../types";

export const PROFIT_LOSS: PLData = {
  currentMonth: 5,
  sections: [
    {
      id: "income",
      accounts: [
        { code: "4010", name: "Wholesale roasted coffee", vals: [184200, 196480, 211340, 198750, 224180, 0, 0, 0, 0, 0, 0, 0] },
        { code: "4020", name: "Retail café sales",         vals: [142560, 138210, 156870, 161220, 168340, 0, 0, 0, 0, 0, 0, 0] },
        { code: "4030", name: "Subscription box revenue",  vals: [ 48100,  49260,  51380,  53420,  55980, 0, 0, 0, 0, 0, 0, 0] },
        { code: "4040", name: "Merchandise & retail goods",vals: [ 12480,  10920,  14210,  13680,  16450, 0, 0, 0, 0, 0, 0, 0] },
        { code: "4090", name: "Other operating income",    vals: [   850,   1200,    640,    980,   1420, 0, 0, 0, 0, 0, 0, 0] },
      ],
    },
    {
      id: "cogs",
      accounts: [
        { code: "5010", name: "Green coffee purchases", vals: [ 86420,  91240,  98760,  92810, 105420, 0, 0, 0, 0, 0, 0, 0] },
        { code: "5020", name: "Roasting labor",         vals: [ 24800,  24800,  26100,  26100,  26100, 0, 0, 0, 0, 0, 0, 0] },
        { code: "5030", name: "Packaging & supplies",   vals: [ 11240,  10820,  12480,  11960,  13680, 0, 0, 0, 0, 0, 0, 0] },
        { code: "5040", name: "Freight in",             vals: [  6420,   5980,   7140,   6850,   8210, 0, 0, 0, 0, 0, 0, 0] },
      ],
    },
    {
      id: "opex",
      accounts: [
        { code: "6010", name: "Salaries & wages",         vals: [ 78400,  78400,  82100,  82100,  82100, 0, 0, 0, 0, 0, 0, 0] },
        { code: "6020", name: "Payroll taxes & benefits", vals: [ 18420,  18420,  19320,  19320,  19320, 0, 0, 0, 0, 0, 0, 0] },
        { code: "6030", name: "Rent & occupancy",         vals: [ 14800,  14800,  14800,  14800,  14800, 0, 0, 0, 0, 0, 0, 0] },
        { code: "6040", name: "Utilities",                vals: [  2840,   2620,   2480,   2310,   2680, 0, 0, 0, 0, 0, 0, 0] },
        { code: "6050", name: "Marketing & advertising",  vals: [  8200,   6400,  11280,   9100,  14620, 0, 0, 0, 0, 0, 0, 0] },
        { code: "6060", name: "Software & subscriptions", vals: [  3240,   3240,   3520,   3520,   3680, 0, 0, 0, 0, 0, 0, 0] },
        { code: "6070", name: "Insurance",                vals: [  2480,   2480,   2480,   2480,   2480, 0, 0, 0, 0, 0, 0, 0] },
        { code: "6080", name: "Travel & entertainment",   vals: [  1240,    820,   2640,   1980,   3420, 0, 0, 0, 0, 0, 0, 0] },
        { code: "6090", name: "Professional fees",        vals: [  4500,   2800,   3200,   2600,   3100, 0, 0, 0, 0, 0, 0, 0] },
        { code: "6100", name: "Office & general",         vals: [  1820,   1640,   2010,   1840,   2210, 0, 0, 0, 0, 0, 0, 0] },
      ],
    },
  ],
};
