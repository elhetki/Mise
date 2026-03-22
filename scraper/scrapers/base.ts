export interface AvailabilitySlot {
  date: string        // YYYY-MM-DD
  time: string        // HH:MM
  partySizes: number[] // which party sizes are available
}

export interface ScraperResult {
  restaurantId: string
  restaurantName: string
  slots: AvailabilitySlot[]
  scrapedAt: Date
  error?: string
  simulated?: boolean
}

export abstract class BaseScraper {
  abstract name: string
  abstract scrape(): Promise<ScraperResult>

  /** Generate realistic fake availability slots for simulation mode */
  protected simulateAvailability(
    restaurantId: string,
    restaurantName: string,
  ): ScraperResult {
    const slots: AvailabilitySlot[] = []
    const now = new Date()

    // Simulate ~30% of days having availability over next 30 days
    for (let i = 1; i <= 30; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + i)

      // Skip Mondays (many fine dining closed)
      if (date.getDay() === 1) continue

      // ~30% chance of availability per day
      if (Math.random() > 0.3) continue

      const dateStr = date.toISOString().split('T')[0]
      const times = ['12:00', '12:30', '13:00', '19:00', '19:30', '20:00', '20:30', '21:00']
      const availableTimes = times.filter(() => Math.random() > 0.5)

      for (const time of availableTimes) {
        const partySizes = [2, 4].filter(() => Math.random() > 0.3)
        if (partySizes.length > 0) {
          slots.push({ date: dateStr, time, partySizes })
        }
      }
    }

    return {
      restaurantId,
      restaurantName,
      slots,
      scrapedAt: new Date(),
      simulated: true,
    }
  }
}
