export interface BookingFormData {
  numberOfPeople: number;
  selectedGames: string[];
  wantDrinks: boolean;
  wantSnacks: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startTime: Date;
  endTime: Date;
}

export interface Booking {
  id: string;
  numberOfPeople: number;
  selectedGames: string[];
  refreshments: {
    drinks: boolean;
    snacks: boolean;
  };
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  calendarEventId?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}
