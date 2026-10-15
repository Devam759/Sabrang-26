export interface ScheduleItem {
  time: string;
  title: string;
  location?: string;
  batches: number[];
  speaker?: string;
}

export interface DaySchedule {
  day: string;
  date: string;
  theme?: string;
  events: ScheduleItem[];
}

export const SCHEDULE_DATA: DaySchedule[] = [
  {
    day: 'Day 01',
    date: 'July 14',
    theme: 'Open Skies Day',
    events: [
      { time: '11:00 AM - 12:30 PM', title: 'Inaugural Ceremony', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] },
      { time: '12:30 PM - 1:00 PM', title: 'Sabrang Schedule | Rules & Regulations', speaker: 'Mr. Deepak Sogani', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] },
      { time: '1:00 PM - 2:30 PM', title: 'Lunch', batches: [1, 2, 3, 4] },
      { time: '2:30 PM - 5:30 PM', title: 'Ice Breaking Session by Manish Freeman & Team', location: 'New Tech Block - Room 001, 002, 006, 008, 009', batches: [1, 2, 3, 4] },
      { time: '5:30 PM - 6:30 PM', title: 'High-Tea', batches: [1, 2, 3, 4] },
      { time: '6:30 PM - 9:00 PM', title: 'Treasure Hunt by Manish Freeman & Team', location: 'JKLU Campus', batches: [1, 2, 3, 4] },
      { time: '9:00 PM - 10:30 PM', title: 'Dinner', batches: [1, 2, 3, 4] },
      { time: '10:30 PM - 11:30 PM', title: 'Kingdom Game Night by Manish Freeman & Team', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] }
    ]
  },
  {
    day: 'Day 02',
    date: 'July 15',
    theme: 'Bollywood Day',
    events: [
      { time: '6:30 AM - 7:30 AM', title: 'Sports Activities', batches: [1, 2, 3, 4] },
      { time: '7:30 AM - 8:50 AM', title: 'Breakfast', batches: [1, 2, 3, 4] },
      { time: '9:30 AM - 1:00 PM', title: 'Youth UnConference by Manish Freeman and Team', location: 'New Tech Block - Room 001, 002, 006, 008, 009', batches: [1, 2, 3, 4] },
      { time: '1:00 PM - 2:30 PM', title: 'Lunch', batches: [1, 2, 3, 4] },
      { time: '2:30 PM - 5:30 PM', title: 'Auction Arena', location: 'IM Amphitheater, IET Amphitheater, New Tech Block - Room 001, 006', batches: [1, 2, 3, 4] },
      { time: '5:30 PM - 6:30 PM', title: 'High-Tea', batches: [1, 2, 3, 4] },
      { time: '6:30 PM - 9:00 PM', title: 'Decode the Drama', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] },
      { time: '9:00 PM - 10:30 PM', title: 'Dinner', batches: [1, 2, 3, 4] },
      { time: '10:30 PM - 11:30 PM', title: 'Drop The Beat', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] }
    ]
  },
  {
    day: 'Day 03',
    date: 'July 16',
    theme: 'Canvas Day',
    events: [
      { time: '6:30 AM - 7:30 AM', title: 'Sports Activities', batches: [1, 2, 3, 4] },
      { time: '7:30 AM - 8:50 AM', title: 'Breakfast', batches: [1, 2, 3, 4] },
      { time: '9:30 AM - 1:00 PM', title: 'Session on POSH and Digital Well Being', speaker: 'Mrs. Anjali Suneja', location: 'IM Amphitheater', batches: [1] },
      { time: '9:30 AM - 1:00 PM', title: 'Craft Appreciation and Art Workshop', speaker: 'Mr. Amitanshu Shrivastava', location: 'New Tech Block - Room 008, 009', batches: [2] },
      { time: '9:30 AM - 1:00 PM', title: 'Clay All Day', speaker: 'Mr. Kunal Agarwal', location: 'New Tech Block - Room 006, 001', batches: [3] },
      { time: '9:30 AM - 12:00 PM', title: 'Goal Setting Workshop By CCCT Faculties', location: 'IET Amphitheater', batches: [4] },
      { time: '12:00 PM - 1:00 PM', title: 'Session on Art of Living', location: 'IET Amphitheater', batches: [4] },
      { time: '1:00 PM - 2:00 PM', title: 'Lunch', batches: [1, 2, 3, 4] },
      { time: '2:00 PM - 5:30 PM', title: 'Craft Appreciation and Art Workshop', speaker: 'Mr. Amitanshu Shrivastava', location: 'New Tech Block - Room 008, 009', batches: [1] },
      { time: '2:00 PM - 3:00 PM', title: 'Session on Art of Living', location: 'IET Amphitheater', batches: [2] },
      { time: '3:00 PM - 5:30 PM', title: 'Goal Setting Workshop By CCCT Faculties', location: 'IET Amphitheater', batches: [2] },
      { time: '2:00 PM - 5:30 PM', title: 'Session on POSH and Digital Well Being', speaker: 'Mrs. Anjali Suneja', location: 'IM Amphitheater', batches: [3] },
      { time: '2:00 PM - 5:30 PM', title: 'Clay All Day', speaker: 'Mr. Kunal Agarwal', location: 'New Tech Block - Room 006, 001', batches: [4] },
      { time: '5:30 PM - 6:30 PM', title: 'High-Tea', batches: [1, 2, 3, 4] },
      { time: '6:30 PM - 8:30 PM', title: 'Canvas Connections', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] },
      { time: '8:30 PM - 10:00 PM', title: 'Dinner', batches: [1, 2, 3, 4] },
      { time: '10:00 PM - 11:30 PM', title: 'Own the Stage', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] }
    ]
  },
  {
    day: 'Day 04',
    date: 'July 17',
    theme: 'Anime & Toons Day',
    events: [
      { time: '6:30 AM - 7:30 AM', title: 'Sports Activities', batches: [1, 2, 3, 4] },
      { time: '7:30 AM - 8:50 AM', title: 'Breakfast', batches: [1, 2, 3, 4] },
      { time: '9:30 AM - 1:00 PM', title: 'Clay All Day', speaker: 'Mr. Kunal Agarwal', location: 'New Tech Block - Room 006, 001', batches: [1] },
      { time: '9:30 AM - 1:00 PM', title: 'Session on POSH and Digital Well Being', speaker: 'Mrs. Anjali Suneja', location: 'IM Amphitheater', batches: [2] },
      { time: '9:30 AM - 12:00 PM', title: 'Goal Setting Workshop By CCCT Faculties', location: 'IET Amphitheater', batches: [3] },
      { time: '12:00 PM - 1:00 PM', title: 'Session on Art of Living', location: 'IET Amphitheater', batches: [3] },
      { time: '9:30 AM - 1:00 PM', title: 'Craft Appreciation and Art Workshop', speaker: 'Mr. Amitanshu Shrivastava', location: 'New Tech Block - Room 008, 009', batches: [4] },
      { time: '1:00 PM - 2:00 PM', title: 'Lunch', batches: [1, 2, 3, 4] },
      { time: '2:00 PM - 3:00 PM', title: 'Session on Art of Living', location: 'IET Amphitheater', batches: [1] },
      { time: '3:00 PM - 5:30 PM', title: 'Goal Setting Workshop By CCCT Faculties', location: 'IET Amphitheater', batches: [1] },
      { time: '2:00 PM - 5:30 PM', title: 'Clay All Day', speaker: 'Mr. Kunal Agarwal', location: 'New Tech Block - Room 006, 001', batches: [2] },
      { time: '2:00 PM - 5:30 PM', title: 'Craft Appreciation and Art Workshop', speaker: 'Mr. Amitanshu Shrivastava', location: 'New Tech Block - Room 008, 009', batches: [3] },
      { time: '2:00 PM - 5:30 PM', title: 'Session on POSH and Digital Well Being', speaker: 'Mrs. Anjali Suneja', location: 'IM Amphitheater', batches: [4] },
      { time: '5:30 PM - 6:30 PM', title: 'High-Tea', batches: [1, 2, 3, 4] },
      { time: '6:30 PM - 8:30 PM', title: 'Dance-Verse', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] },
      { time: '8:30 PM - 10:00 PM', title: 'Dinner', batches: [1, 2, 3, 4] },
      { time: '10:00 PM - 11:30 PM', title: 'Lights. Camera. Chill.', location: 'IM Amphitheater, IET Amphitheater, New Tech Block - Room 001, 002, 006', batches: [1, 2, 3, 4] }
    ]
  },
  {
    day: 'Day 05',
    date: 'July 18',
    theme: 'Ethnic Day',
    events: [
      { time: '6:30 AM - 7:30 AM', title: 'Sports Activities', batches: [1, 2, 3, 4] },
      { time: '7:30 AM - 8:50 AM', title: 'Breakfast', batches: [1, 2, 3, 4] },
      // Batch 1
      { time: '9:00 AM - 11:00 AM', title: 'Mind Hacks: The Hidden Psychology Behind Every Decision', speaker: 'Mr. Manan Pahwa', location: 'IM Amphitheater', batches: [1] },
      { time: '12:00 PM - 1:00 PM', title: 'Decode Academics by Academic Affairs', location: 'IM Amphitheater', batches: [1] },
      { time: '1:00 PM - 2:00 PM', title: 'Lunch', batches: [1] },
      { time: '1:30 PM - 3:00 PM', title: 'Alumni Connect', location: 'New Tech Block - Room 001', batches: [1] },
      { time: '3:00 PM - 4:30 PM', title: 'Cyber Security for All', speaker: 'Mr. Mukesh Choudhary', location: 'New Tech Block - Room 008', batches: [1] },
      { time: '4:30 PM - 5:00 PM', title: 'Anti-Ragging Awareness and Prevention Session', location: 'New Tech Block - Room 008', batches: [1] },
      { time: '5:00 PM - 5:30 PM', title: 'Hostel 101', location: 'New Tech Block - Room 008', batches: [1] },
      // Batch 2
      { time: '9:00 AM - 10:30 AM', title: 'Student Central by Student Affairs', location: 'New Tech Block - Room 008', batches: [2] },
      { time: '10:30 AM - 11:00 AM', title: 'The Admin Guide', location: 'New Tech Block - Room 008', batches: [2] },
      { time: '12:00 PM - 1:30 PM', title: 'Cyber Security for All', speaker: 'Mr. Mukesh Choudhary', location: 'New Tech Block - Room 008', batches: [2] },
      { time: '1:30 PM - 2:00 PM', title: 'Lunch', batches: [2] },
      { time: '2:00 PM - 3:00 PM', title: 'Creating Your Own Path', speaker: 'Mr. RamG Vallath', location: 'IM Amphitheater', batches: [2] },
      { time: '3:00 PM - 4:30 PM', title: 'Innovation and Entrepreneurship at JKLU by AIC', location: 'New Tech Block - Room 002', batches: [2] },
      { time: '4:30 PM - 6:00 PM', title: 'Session on Mental Health', location: 'IM Amphitheater', batches: [2] },
      // Batch 3
      { time: '9:00 AM - 9:30 AM', title: 'Hostel 101', location: 'New Tech Block - Room 001', batches: [3] },
      { time: '9:30 AM - 10:00 AM', title: 'Anti-Ragging Awareness and Prevention Session', location: 'New Tech Block - Room 001', batches: [3] },
      { time: '10:00 AM - 11:00 AM', title: 'Decode Academics by Academic Affairs', location: 'New Tech Block - Room 001', batches: [3] },
      { time: '12:00 PM - 1:00 PM', title: 'Lunch', batches: [3] },
      { time: '1:00 PM - 1:30 PM', title: 'JKLU Essentials By IT/LRC/Accounts', location: 'New Tech Block - Room 001', batches: [3] },
      { time: '1:30 PM - 3:00 PM', title: 'Cyber Security for All', speaker: 'Mr. Mukesh Choudhary', location: 'New Tech Block - Room 008', batches: [3] },
      { time: '3:00 PM - 4:00 PM', title: 'Creating Your Own Path', speaker: 'Mr. RamG Vallath', location: 'IM Amphitheater', batches: [3] },
      { time: '4:00 PM - 5:30 PM', title: 'Alumni Connect', location: 'New Tech Block - Room 001', batches: [3] },
      { time: '5:30 PM - 6:00 PM', title: 'The Admin Guide', location: 'New Tech Block - Room 001', batches: [3] },
      // Batch 4
      { time: '9:30 AM - 11:00 AM', title: 'Innovation and Entrepreneurship at JKLU by AIC', location: 'IET Amphitheater', batches: [4] },
      { time: '12:00 PM - 1:30 PM', title: 'Session on Mental Health', location: 'IET Amphitheater', batches: [4] },
      { time: '1:30 PM - 2:30 PM', title: 'Lunch', batches: [4] },
      { time: '2:30 PM - 4:30 PM', title: 'Mind Hacks: The Hidden Psychology Behind Every Decision', speaker: 'Mr. Manan Pahwa', location: 'IET Amphitheater', batches: [4] },
      { time: '4:30 PM - 6:00 PM', title: 'Cyber Security for All', speaker: 'Mr. Mukesh Choudhary', location: 'IET Amphitheater', batches: [4] },
      // Common Evening
      { time: '5:30 PM - 6:30 PM', title: 'High-Tea', batches: [1, 2, 3, 4] },
      { time: '6:30 PM - 8:30 PM', title: 'The Culture Walk', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] },
      { time: '8:30 PM - 10:00 PM', title: 'Dinner', batches: [1, 2, 3, 4] },
      { time: '10:00 PM - 11:30 PM', title: 'JKLU Unfiltered: No Script Attached', location: 'IM Amphitheater, IET Amphitheater, New Tech Block - Room 006, 008, 009', batches: [1, 2, 3, 4] }
    ]
  },
  {
    day: 'Day 06',
    date: 'July 19',
    theme: 'Black & White 90s Day',
    events: [
      { time: '6:30 AM - 7:30 AM', title: 'Sports Activities', batches: [1, 2, 3, 4] },
      { time: '7:30 AM - 8:50 AM', title: 'Breakfast', batches: [1, 2, 3, 4] },
      // Batch 1
      { time: '9:30 AM - 10:30 AM', title: 'Creating Your Own Path', speaker: 'Mr. RamG Vallath', location: 'IM Amphitheater', batches: [1] },
      { time: '10:30 AM - 11:00 AM', title: 'Global Learning Opportunities at JKLU', location: 'New Tech Block - Room 008', batches: [1] },
      { time: '11:00 AM - 11:30 AM', title: 'The Admin Guide', location: 'New Tech Block - Room 008', batches: [1] },
      { time: '11:30 AM - 1:00 PM', title: 'Session on Mental Health', location: 'IET Amphitheater', batches: [1] },
      { time: '1:00 PM - 2:00 PM', title: 'Lunch', batches: [1] },
      { time: '2:00 PM - 3:30 PM', title: 'Student Central by Student Affairs', location: 'IM Amphitheater', batches: [1] },
      { time: '3:30 PM - 4:00 PM', title: 'JKLU Essentials By IT/LRC/Accounts', location: 'IM Amphitheater', batches: [1] },
      { time: '4:00 PM - 5:30 PM', title: 'Innovation and Entrepreneurship at JKLU by AIC', location: 'IM Amphitheater', batches: [1] },
      // Batch 2
      { time: '9:30 AM - 11:30 AM', title: 'Mind Hacks: The Hidden Psychology Behind Every Decision', speaker: 'Mr. Manan Pahwa', location: 'IET Amphitheater', batches: [2] },
      { time: '11:30 AM - 1:00 PM', title: 'Alumni Connect', location: 'New Tech Block - Room 001', batches: [2] },
      { time: '1:00 PM - 2:00 PM', title: 'Lunch', batches: [2] },
      { time: '2:00 PM - 3:00 PM', title: 'Decode Academics by Academic Affairs', location: 'New Tech Block - Room 001', batches: [2] },
      { time: '3:00 PM - 3:30 PM', title: 'Hostel 101', location: 'New Tech Block - Room 001', batches: [2] },
      { time: '3:30 PM - 4:00 PM', title: 'Anti-Ragging Awareness and Prevention Session', location: 'New Tech Block - Room 001', batches: [2] },
      { time: '4:00 PM - 4:30 PM', title: 'Global Learning Opportunities at JKLU', location: 'IET Amphitheater', batches: [2] },
      { time: '4:30 PM - 5:00 PM', title: 'JKLU Essentials By IT/LRC/Accounts', location: 'IET Amphitheater', batches: [2] },
      // Batch 3
      { time: '9:30 AM - 11:00 AM', title: 'Student Central by Student Affairs', location: 'New Tech Block - Room 001', batches: [3] },
      { time: '11:00 AM - 11:30 AM', title: 'Global Learning Opportunities at JKLU', location: 'New Tech Block - Room 001', batches: [3] },
      { time: '11:30 AM - 1:00 PM', title: 'Innovation and Entrepreneurship at JKLU by AIC', location: 'IM Amphitheater', batches: [3] },
      { time: '1:00 PM - 2:00 PM', title: 'Lunch', batches: [3] },
      { time: '2:00 PM - 4:00 PM', title: 'Mind Hacks: The Hidden Psychology Behind Every Decision', speaker: 'Mr. Manan Pahwa', location: 'IET Amphitheater', batches: [3] },
      { time: '4:00 PM - 5:30 PM', title: 'Session on Mental Health', location: 'New Tech Block - Room 008', batches: [3] },
      // Batch 4
      { time: '9:30 AM - 10:30 AM', title: 'Decode Academics by Academic Affairs', location: 'New Tech Block - Room 008', batches: [4] },
      { time: '10:30 AM - 11:30 AM', title: 'Creating Your Own Path', speaker: 'Mr. RamG Vallath', location: 'IM Amphitheater', batches: [4] },
      { time: '11:30 AM - 12:00 PM', title: 'Global Learning Opportunities at JKLU', location: 'New Tech Block - Room 008', batches: [4] },
      { time: '12:00 PM - 1:30 PM', title: 'Student Central by Student Affairs', location: 'New Tech Block - Room 008', batches: [4] },
      { time: '1:30 PM - 2:00 PM', title: 'Lunch', batches: [4] },
      { time: '2:00 PM - 3:30 PM', title: 'Alumni Connect', location: 'New Tech Block - Room 008', batches: [4] },
      { time: '3:30 PM - 4:00 PM', title: 'The Admin Guide', location: 'New Tech Block - Room 008', batches: [4] },
      { time: '4:00 PM - 4:30 PM', title: 'JKLU Essentials By IT/LRC/Accounts', location: 'New Tech Block - Room 001', batches: [4] },
      { time: '4:30 PM - 5:00 PM', title: 'Hostel 101', location: 'New Tech Block - Room 001', batches: [4] },
      { time: '5:00 PM - 5:30 PM', title: 'Anti-Ragging Awareness and Prevention Session', location: 'New Tech Block - Room 001', batches: [4] },
      // Common Evening
      { time: '5:30 PM - 6:30 PM', title: 'High-Tea', batches: [1, 2, 3, 4] },
      { time: '6:30 PM - 8:30 PM', title: 'Loud Enough?', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] },
      { time: '8:30 PM - 12:00 AM', title: 'Dinner', batches: [1, 2, 3, 4] },
      { time: 'Midnight', title: 'Live telecast of FIFA Final', location: 'Football Ground', batches: [1, 2, 3, 4] }
    ]
  },
  {
    day: 'Day 07',
    date: 'July 20',
    theme: 'Fresh and fun Day',
    events: [
      { time: '4:30 AM - 12:30 PM', title: 'Outing Activity', batches: [1, 2, 3, 4] },
      { time: '1:00 PM - 2:00 PM', title: 'Lunch', batches: [1, 2, 3, 4] },
      { time: '2:00 PM - 5:30 PM', title: 'Fold & Design', speaker: 'Design Club', location: 'IM Amphitheater, IET Amphitheater', batches: [1] },
      { time: '2:00 PM - 5:30 PM', title: 'Canvas Beyond: Art Expression Workshop by Art Club', location: 'New Tech Block - Room 008', batches: [2] },
      { time: '2:00 PM - 5:30 PM', title: 'VR Zone By Tech Club', location: 'New Tech Block - Room 006', batches: [3] },
      { time: '2:00 PM - 5:30 PM', title: 'Multiple Club Events', location: 'New Tech Block - Room 001, 002, 005', batches: [4] },
      { time: '5:30 PM - 6:30 PM', title: 'High-Tea', batches: [1, 2, 3, 4] },
      { time: '6:30 PM - 9:00 PM', title: 'Stories Framed', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] },
      { time: '9:00 PM - 10:30 PM', title: 'Dinner', batches: [1, 2, 3, 4] },
      { time: '10:30 PM - 11:30 PM', title: 'Star Gazing By Astronomy Club & Sabrang Team & Vibe Check', location: 'New Tech Block - First Floor', batches: [1, 2, 3, 4] }
    ]
  },
  {
    day: 'Day 08',
    date: 'July 21',
    theme: 'Formal Day',
    events: [
      { time: '6:30 AM - 7:30 AM', title: 'Rest', batches: [1, 2, 3, 4] },
      { time: '7:30 AM - 9:00 AM', title: 'Breakfast', batches: [1, 2, 3, 4] },
      { time: '9:30 AM - 1:00 PM', title: 'Know Your Institution & Placement Cell Orientation (Institute wise)', batches: [1, 2, 3, 4] },
      { time: '1:00 PM - 2:30 PM', title: 'Lunch', batches: [1, 2, 3, 4] },
      { time: '2:30 PM - 5:30 PM', title: 'Battle of the Clusters & Valedictory Ceremony', location: 'Sabrang Ground - Main Stage', batches: [1, 2, 3, 4] },
      { time: '5:30 PM - 6:30 PM', title: 'Check-out by Day Scholars', batches: [1, 2, 3, 4] },
      { time: '6:30 PM - 9:00 PM', title: 'Departure of Buses at 6:30 PM from JKLU Main Gate', batches: [1, 2, 3, 4] }
    ]
  }
];
