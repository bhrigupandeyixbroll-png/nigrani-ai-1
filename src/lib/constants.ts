export const INDIAN_STATES = [
  { state: "Karnataka", district: "Bengaluru Urban", constituency: "Bengaluru South", mp: "Tejasvi Surya", lat: 12.9716, lng: 77.5946, zone: "South" },
  { state: "Karnataka", district: "Mysuru", constituency: "Mysore-Kodagu", mp: "Yaduveer Krishnadatta Wadiyar", lat: 12.2958, lng: 76.6394, zone: "South" },
  { state: "Karnataka", district: "Belagavi", constituency: "Belgaum", mp: "Jagadish Shettar", lat: 15.8497, lng: 74.4977, zone: "South" },
  { state: "Maharashtra", district: "Pune", constituency: "Pune", mp: "Murlidhar Mohol", lat: 18.5204, lng: 73.8567, zone: "West" },
  { state: "Maharashtra", district: "Nagpur", constituency: "Nagpur", mp: "Nitin Gadkari", lat: 21.1458, lng: 79.0882, zone: "West" },
  { state: "Maharashtra", district: "Nashik", constituency: "Nashik", mp: "Rajabhau Waje", lat: 19.9975, lng: 73.7898, zone: "West" },
  { state: "Maharashtra", district: "Mumbai Suburban", constituency: "Mumbai North", mp: "Piyush Goyal", lat: 19.0760, lng: 72.8777, zone: "West" },
  { state: "Rajasthan", district: "Jaipur", constituency: "Jaipur", mp: "Manju Sharma", lat: 26.9124, lng: 75.7873, zone: "North" },
  { state: "Rajasthan", district: "Jodhpur", constituency: "Jodhpur", mp: "Gajendra Singh Shekhawat", lat: 26.2389, lng: 73.0243, zone: "North" },
  { state: "Rajasthan", district: "Udaipur", constituency: "Udaipur", mp: "Manna Lal Rawat", lat: 24.5854, lng: 73.7125, zone: "North" },
  { state: "Odisha", district: "Khordha", constituency: "Bhubaneswar", mp: "Aparajita Sarangi", lat: 20.2961, lng: 85.8245, zone: "East" },
  { state: "Odisha", district: "Cuttack", constituency: "Cuttack", mp: "Bhartruhari Mahtab", lat: 20.4625, lng: 85.8828, zone: "East" },
  { state: "Odisha", district: "Puri", constituency: "Puri", mp: "Sambit Patra", lat: 19.8135, lng: 85.8312, zone: "East" },
  { state: "Tamil Nadu", district: "Coimbatore", constituency: "Coimbatore", mp: "Ganapathi P. Rajkumar", lat: 11.0168, lng: 76.9558, zone: "South" },
  { state: "Tamil Nadu", district: "Chennai", constituency: "Chennai Central", mp: "Dayanidhi Maran", lat: 13.0827, lng: 80.2707, zone: "South" },
  { state: "Tamil Nadu", district: "Madurai", constituency: "Madurai", mp: "Su. Venkatesan", lat: 9.9252, lng: 78.1198, zone: "South" },
  { state: "Assam", district: "Kamrup Metropolitan", constituency: "Guwahati", mp: "Bijuli Kalita Medhi", lat: 26.1445, lng: 91.7362, zone: "Northeast" },
  { state: "Assam", district: "Dibrugarh", constituency: "Dibrugarh", mp: "Sarbananda Sonowal", lat: 27.4728, lng: 94.9120, zone: "Northeast" },
  { state: "Madhya Pradesh", district: "Indore", constituency: "Indore", mp: "Shankar Lalwani", lat: 22.7196, lng: 75.8577, zone: "Central" },
  { state: "Madhya Pradesh", district: "Bhopal", constituency: "Bhopal", mp: "Alok Sharma", lat: 23.2599, lng: 77.4126, zone: "Central" },
  { state: "Uttar Pradesh", district: "Varanasi", constituency: "Varanasi", mp: "Narendra Modi", lat: 25.3176, lng: 82.9739, zone: "North" },
  { state: "Uttar Pradesh", district: "Lucknow", constituency: "Lucknow", mp: "Rajnath Singh", lat: 26.8467, lng: 80.9462, zone: "North" },
  { state: "Uttar Pradesh", district: "Prayagraj", constituency: "Allahabad", mp: "Ujjwal Raman Singh", lat: 25.4358, lng: 81.8463, zone: "North" },
  { state: "Kerala", district: "Ernakulam", constituency: "Ernakulam", mp: "Hibi Eden", lat: 9.9816, lng: 76.2999, zone: "South" },
  { state: "Kerala", district: "Thiruvananthapuram", constituency: "Thiruvananthapuram", mp: "Shashi Tharoor", lat: 8.5241, lng: 76.9366, zone: "South" },
  { state: "Bihar", district: "Patna", constituency: "Patna Sahib", mp: "Ravi Shankar Prasad", lat: 25.5941, lng: 85.1376, zone: "East" },
  { state: "Gujarat", district: "Ahmedabad", constituency: "Gandhinagar", mp: "Amit Shah", lat: 23.0225, lng: 72.5714, zone: "West" },
  { state: "Gujarat", district: "Surat", constituency: "Surat", mp: "Mukesh Dalal", lat: 21.1702, lng: 72.8311, zone: "West" },
  { state: "Telangana", district: "Hyderabad", constituency: "Hyderabad", mp: "Asaduddin Owaisi", lat: 17.3850, lng: 78.4867, zone: "South" },
  { state: "West Bengal", district: "Kolkata", constituency: "Kolkata Uttar", mp: "Sudip Bandyopadhyay", lat: 22.5726, lng: 88.3639, zone: "East" },
];

export const MPLADS_SECTORS = [
  "Community Infrastructure",
  "Education & Schools",
  "Drinking Water & Sanitation",
  "Health & Family Welfare",
  "Roads, Pathways & Bridges",
  "Renewable Energy & Solar",
  "Irrigation & Water Conservation",
  "Digital & Skill Development",
  "Sports & Youth Infrastructure",
];

export function formatInrCurrency(value: string | number | null | undefined, compact: boolean = true) {
  const n = Number(value ?? 0);
  if (compact) {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)} Lakh`;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
