/**
 * Game configurations
 * Each game defines its defaults for the calculators.
 */
const games = [
  {
    id: 'aion2',
    name: 'Aion 2',
    icon: '⚔️',
    currency: '₭',
    currencyName: 'Kinah',
    defaultTaxRate: 20,
    defaultRegFee: 11,
    description: 'Aion 2 Market',
  },
  // Future games can be added here:
  // {
  //   id: 'throne-and-liberty',
  //   name: 'Throne & Liberty',
  //   icon: '🏰',
  //   currency: 'L',
  //   currencyName: 'Lucent',
  //   defaultTaxRate: 10,
  //   defaultRegFee: 0,
  //   description: 'TL Auction House',
  // },
]

export default games

export const getGame = (id) => games.find(g => g.id === id) || games[0]
