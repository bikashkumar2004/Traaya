/**
 * Comprehensive India Administrative Divisions: States, Districts & Blocks
 * Provides structured cascading lookup: State -> District -> Block
 */

export interface IndiaHierarchy {
  [state: string]: {
    [district: string]: string[];
  };
}

export const INDIA_LOCATIONS: IndiaHierarchy = {
  "Odisha": {
    "Nayagarh": [
      "Nayagarh",
      "Khandapada",
      "Bhapur",
      "Daspalla",
      "Gania",
      "Nuagaon",
      "Odagaon",
      "Ranpur"
    ],
    "Khordha": [
      "Bhubaneswar",
      "Jatni",
      "Khordha",
      "Balianta",
      "Balipatna",
      "Banapur",
      "Begunia",
      "Bolagarh",
      "Chilika",
      "Tangi"
    ],
    "Cuttack": [
      "Cuttack Sadar",
      "Athagarh",
      "Banki",
      "Baramba",
      "Choudwar",
      "Kantapada",
      "Mahanga",
      "Narsinghpur",
      "Niali",
      "Nischintakoili",
      "Salepur",
      "Tangi-Choudwar",
      "Tigiria"
    ],
    "Angul": [
      "Angul",
      "Athamallik",
      "Banarpal",
      "Chhendipada",
      "Kaniha",
      "Kishorenagar",
      "Pallahara",
      "Talcher"
    ],
    "Puri": [
      "Puri Sadar",
      "Brahmagiri",
      "Delanga",
      "Gop",
      "Kakatpur",
      "Kanas",
      "Krushnaprasad",
      "Nimapara",
      "Pipili",
      "Satyabadi"
    ],
    "Ganjam": [
      "Chhatrapur",
      "Berhampur",
      "Aska",
      "Bellaguntha",
      "Bhanjanagar",
      "Buguda",
      "Chikiti",
      "Digapahandi",
      "Ganjam",
      "Hinjilicut",
      "Kabisuryanagar",
      "Khalikote",
      "Polasara",
      "Purushottampur",
      "Sanakhemundi",
      "Surada"
    ],
    "Balasore": [
      "Balasore Sadar",
      "Bahanaga",
      "Basta",
      "Bhograi",
      "Jaleswar",
      "Khaira",
      "Nilgiri",
      "Oupada",
      "Remuna",
      "Simulia",
      "Soro"
    ],
    "Bhadrak": [
      "Bhadrak",
      "Basudevpur",
      "Bhandaripokhari",
      "Bonth",
      "Chandabali",
      "Dhamnagar",
      "Tihidi"
    ],
    "Mayurbhanj": [
      "Baripada",
      "Badasahi",
      "Bahalda",
      "Bangriposi",
      "Betnoti",
      "Karanjia",
      "Morada",
      "Rairangpur",
      "Saraskana",
      "Udala"
    ],
    "Sambalpur": [
      "Sambalpur",
      "Bamra",
      "Dhankauda",
      "Jamankira",
      "Jujumura",
      "Kuchinda",
      "Maneswar",
      "Naktideul",
      "Rairakhol",
      "Rengali"
    ],
    "Sundargarh": [
      "Sundargarh",
      "Bargaon",
      "Bisra",
      "Bonaigarh",
      "Hemgir",
      "Kutra",
      "Lathikata",
      "Panposh",
      "Rajgangpur",
      "Rourkela",
      "Subdega",
      "Tangarpali"
    ],
    "Bargarh": [
      "Bargarh",
      "Attabira",
      "Barpali",
      "Bhatli",
      "Bheden",
      "Bijepur",
      "Gaisilet",
      "Jharbandh",
      "Padampur",
      "Paikmal",
      "Sohela"
    ],
    "Bolangir": [
      "Bolangir",
      "Agalpur",
      "Bangomunda",
      "Belpada",
      "Deogaon",
      "Gudvella",
      "Loisingha",
      "Muribahal",
      "Patnagarh",
      "Puintala",
      "Titilagarh",
      "Turekela"
    ],
    "Kalahandi": [
      "Bhawanipatna",
      "Dharmagarh",
      "Golamunda",
      "Jaipatna",
      "Junagarh",
      "Kalampur",
      "Karlamunda",
      "Kesinga",
      "Kokasara",
      "Lanjigarh",
      "Madanpur Rampur",
      "Narala",
      "Thuamul Rampur"
    ],
    "Koraput": [
      "Koraput",
      "Baipariguda",
      "Bandhugaon",
      "Borigumma",
      "Dasamantapur",
      "Jeypore",
      "Kotpad",
      "Kundra",
      "Laxmipur",
      "Nandapur",
      "Pottangi",
      "Semiliguda"
    ],
    "Rayagada": [
      "Rayagada",
      "Bissam Cuttack",
      "Chandrapur",
      "Gudari",
      "Gunupur",
      "Kalyansinghpur",
      "Kasipur",
      "Kolnara",
      "Muniguda",
      "Padmapur",
      "Ramanaguda"
    ],
    "Kendrapara": [
      "Kendrapara",
      "Aul",
      "Derabish",
      "Garadpur",
      "Mahakalapada",
      "Marsaghai",
      "Pattamundai",
      "Rajkanika",
      "Rajnagar"
    ],
    "Jagatsinghpur": [
      "Jagatsinghpur",
      "Balikuda",
      "Biridi",
      "Erasama",
      "Kujang",
      "Naugaon",
      "Paradeep",
      "Raghunathpur",
      "Tirtol"
    ],
    "Jajpur": [
      "Jajpur",
      "Badachana",
      "Bari",
      "Binjharpur",
      "Danagadi",
      "Dharmasala",
      "Kalyanpur",
      "Korei",
      "Rasulpur",
      "Sukinda"
    ],
    "Dhenkanal": [
      "Dhenkanal Sadar",
      "Bhuban",
      "Gondia",
      "Hindol",
      "Kamakshyanagar",
      "Kankadahad",
      "Odapada",
      "Parjang"
    ],
    "Keonjhar": [
      "Keonjhar Sadar",
      "Anandapur",
      "Banspal",
      "Champua",
      "Ghatgaon",
      "Harichandanpur",
      "Hatadihi",
      "Jhumpura",
      "Joda",
      "Patna",
      "Saharpada",
      "Telkoi"
    ],
    "Jharsuguda": [
      "Jharsuguda",
      "Kolabira",
      "Kirmira",
      "Laikera",
      "Lakhanpur"
    ],
    "Deogarh": [
      "Barkote",
      "Deogarh",
      "Reamal"
    ],
    "Subarnapur (Sonepur)": [
      "Sonepur",
      "Birmaharajpur",
      "Dunguripali",
      "Tarva",
      "Ullunda"
    ],
    "Boudh": [
      "Boudh",
      "Harabhanga",
      "Kantamal"
    ],
    "Kandhamal": [
      "Phulbani",
      "Baliguda",
      "Chakapada",
      "Daringbadi",
      "G. Udayagiri",
      "K. Nuagaon",
      "Khajuripada",
      "Kotagarh",
      "Raikia",
      "Tikabali",
      "Tumudibandha"
    ],
    "Nabarangpur": [
      "Nabarangpur",
      "Chandahandi",
      "Dabugam",
      "Jharigam",
      "Kodinga",
      "Kosagumuda",
      "Nandahandi",
      "Papadahandi",
      "Raighar",
      "Tentulikhunti",
      "Umerkote"
    ],
    "Nuapada": [
      "Nuapada",
      "Boden",
      "Komna",
      "Khariar",
      "Sinapali"
    ],
    "Malkangiri": [
      "Malkangiri",
      "Chitrakonda",
      "Kalimela",
      "Khairput",
      "Korkunda",
      "Mathili",
      "Podia"
    ],
    "Gajapati": [
      "Paralakhemundi",
      "Gosani",
      "Gumma",
      "Kashinagar",
      "Mohana",
      "Nuagada",
      "R. Udayagiri",
      "Rayagada"
    ]
  },
  "Maharashtra": {
    "Mumbai City": ["Colaba", "Marine Drive", "Dadar", "Worli", "Byculla", "Fort"],
    "Mumbai Suburban": ["Andheri", "Bandra", "Borivali", "Kurla", "Malad", "Ghatkopar", "Mulund"],
    "Pune": ["Haveli", "Khed", "Baramati", "Shirur", "Ambegaon", "Maval", "Daund", "Junnar", "Indapur", "Purandar", "Bhor", "Velhe", "Mulshi"],
    "Nagpur": ["Nagpur Urban", "Nagpur Rural", "Kamptee", "Hingna", "Katol", "Narkhed", "Savner", "Kalmeshwar", "Ramtek", "Parseoni", "Mouda", "Umred", "Kuhi", "Bhiwapur"],
    "Thane": ["Thane", "Kalyan", "Murbad", "Bhiwandi", "Shahapur", "Ulhasnagar", "Ambarnath"],
    "Nashik": ["Nashik", "Malegaon", "Sinnar", "Niphad", "Yeola", "Dindori", "Igatpuri", "Baglan", "Kalwan", "Chandwad", "Deola", "Surgana", "Trimbakeshwar", "Peint"],
    "Aurangabad (Chhatrapati Sambhajinagar)": ["Aurangabad", "Kannad", "Soegaon", "Sillod", "Phulambri", "Khuldabad", "Vaijapur", "Gangapur", "Paithan"],
    "Kolhapur": ["Karvir", "Kagal", "Hatkanangle", "Shirol", "Panhala", "Shahuwadi", "Radhanagari", "Gaganbawada", "Bhudargad", "Ajra", "Gadhinglaj", "Chandgad"],
    "Solapur": ["North Solapur", "South Solapur", "Barshi", "Akkalkot", "Mohol", "Madha", "Karmala", "Pandharpur", "Sangola", "Malshiras", "Mangalwedha"],
    "Amravati": ["Amravati", "Bhatkuli", "Nandgaon Khandeshwar", "Dharni", "Chikhaldara", "Achalpur", "Chandurbazar", "Morshi", "Warud", "Daryapur", "Anjangaon Surji", "Chandur Railway", "Dhamangaon Railway", "Tiosa"]
  },
  "Uttar Pradesh": {
    "Lucknow": ["Bakshi Ka Talab", "Chinhat", "Gosainganj", "Kakori", "Malihabad", "Mohanlalganj", "Sarojininagar"],
    "Varanasi": ["Araziline", "Baragaon", "Chiraigaon", "Cholapur", "Harahua", "Kashi Vidyapeeth", "Pindra", "Sewapuri"],
    "Kanpur Nagar": ["Bilhaur", "Chaubepur", "Ghatampur", "Kalyanpur", "Patara", "Sarsaul", "Shivrajpur", "Vidunu"],
    "Agra": ["Achhnera", "Akola", "Bah", "Barauli Ahir", "Bichpuri", "Etmadpur", "Fatehabad", "Fatehpur Sikri", "Jagner", "Khandauli", "Kheragarh", "Pinahat", "Saiyan", "Shamsabad"],
    "Prayagraj (Allahabad)": ["Bahria", "Chaka", "Dhanupur", "Handia", "Holagarh", "Jasra", "Karchhana", "Kaurihar", "Koraon", "Manda", "Mau Aima", "Meja", "Pratappur", "Saidabad", "Shankargarh", "Soraon", "Uruwa"],
    "Gautam Buddha Nagar (Noida)": ["Bisrakh", "Dankaur", "Dadri", "Jewar"],
    "Ghaziabad": ["Bhojpur", "Loni", "Muradnagar", "Razapur"],
    "Gorakhpur": ["Bansgaon", "Barhalganj", "Belghat", "Brahmpur", "Campierganj", "Chargawan", "Gagaha", "Gola", "Jangla Kaulaganj", "Khajni", "Khorabar", "Pipraich", "Piprauli", "Sahjanwa", "Sardar Nagar", "Uruwa"],
    "Meerut": ["Daurala", "Hastinapur", "Janisath", "Kharkhoda", "Machhra", "Mawana", "Meerut", "Parikshitgarh", "Rajpura", "Rohta", "Sarurpur Khurd"],
    "Aligarh": ["Akrabad", "Atrauli", "Bijauli", "Chandaus", "Dhanipur", "Gonda", "Iglas", "Jawan Sikandarpur", "Khair", "Lodha", "Tappal"]
  },
  "Karnataka": {
    "Bengaluru Urban": ["Anekal", "Bangalore East", "Bangalore North", "Bangalore South", "Yelahanka"],
    "Bengaluru Rural": ["Devanahalli", "Doddaballapura", "Hosakote", "Nelamangala"],
    "Mysuru": ["Mysuru", "Hunsur", "Krishnarajanagara", "Nanjangud", "Piriyapatna", "T. Narasipura", "Saragur"],
    "Dharwad": ["Alnavar", "Annigeri", "Dharwad", "Hubballi Urban", "Hubballi Rural", "Kalghatgi", "Kundgol", "Navalgund"],
    "Belagavi": ["Athani", "Bailhongal", "Belagavi", "Chikkodi", "Gokak", "Hukkeri", "Khanapur", "Kagawad", "Mudalagi", "Nipani", "Ramdurg", "Raybag", "Saundatti"],
    "Dakshina Kannada (Mangaluru)": ["Bantwal", "Belthangady", "Kadaba", "Mangaluru", "Moodabidri", "Puttur", "Sullia"],
    "Udupi": ["Brahmavara", "Byndoor", "Hebri", "Karkala", "Kaup", "Kundapura", "Udupi"],
    "Kalaburagi": ["Afzalpur", "Aland", "Chincholi", "Chittapur", "Kalaburagi", "Jevargi", "Sedam", "Kamalapur", "Shahabad", "Kalagi"]
  },
  "Tamil Nadu": {
    "Chennai": ["Alandur", "Ambattur", "Aminjikarai", "Ayanavaram", "Egmore", "Guindy", "Madhavaram", "Madhuravoyal", "Mambalam", "Mylapore", "Perambur", "Purasawalkam", "Sholinganallur", "Thiruvottiyur", "Tondiarpet", "Velachery"],
    "Coimbatore": ["Anaimalai", "Annur", "Coimbatore North", "Coimbatore South", "Kinathukadavu", "Madukkarai", "Mettupalayam", "Perur", "Pollachi", "Sulur", "Valparai"],
    "Madurai": ["Alanganallur", "Chellampatti", "Kallikudi", "Kottampatti", "Madurai East", "Madurai West", "Melur", "Sedapatti", "T. Vadipatti", "Thirumangalam", "Thiruparankundram", "Usilampatti", "Vadipatti"],
    "Tiruchirappalli": ["Lalgudi", "Manachanallur", "Manapparai", "Marungapuri", "Musiri", "Srirangam", "Thottiyam", "Thuraiyur", "Tiruchirappalli"],
    "Salem": ["Attur", "Edappadi", "Gangavalli", "Kadayampatti", "Mettur", "Omalur", "Pethanaickenpalayam", "Salem", "Sankari", "Thalaivasal", "Valapady", "Yercaud"],
    "Kanchipuram": ["Kanchipuram", "Kundrathur", "Sriperumbudur", "Uthiramerur", "Walajabad"]
  },
  "Delhi": {
    "Central Delhi": ["Civil Lines", "Karol Bagh", "Kotwali"],
    "East Delhi": ["Gandhi Nagar", "Mayur Vihar", "Preet Vihar"],
    "New Delhi": ["Chanakyapuri", "Connaught Place", "Delhi Cantonment"],
    "North Delhi": ["Alipur", "Model Town", "Narela"],
    "North East Delhi": ["Karawal Nagar", "Seelampur", "Yamuna Vihar"],
    "North West Delhi": ["Kanjhawala", "Rohini", "Saraswati Vihar"],
    "Shahdara": ["Seemapuri", "Shahdara", "Vivek Vihar"],
    "South Delhi": ["Hauz Khas", "Mehrauli", "Saket"],
    "South East Delhi": ["Defence Colony", "Kalkaji", "Sarita Vihar"],
    "South West Delhi": ["Dwarka", "Kapashera", "Najafgarh"],
    "West Delhi": ["Patel Nagar", "Punjabi Bagh", "Rajouri Garden"]
  },
  "West Bengal": {
    "Kolkata": ["Alipore", "Ballygunge", "Behala", "Bowbazar", "Cossipore", "Jadavpur", "Park Street", "Salt Lake", "Shyambazar", "Tollygunge"],
    "North 24 Parganas": ["Amdanga", "Baduria", "Bagdah", "Barasat", "Barrackpore", "Basirhat", "Bongaon", "Deganga", "Gaighata", "Habra", "Haroa", "Hasnabad", "Hingalganj", "Minakhan", "Rajarhat", "Sandeshkhali", "Swarupnagar"],
    "South 24 Parganas": ["Baruipur", "Bhangar", "Budge Budge", "Canning", "Diamond Harbour", "Gosaba", "Jaynagar", "Kakdwip", "Kulpi", "Magrahat", "Mandirbazar", "Namkhana", "Patharpratima", "Sagardwip", "Sonarpur"],
    "Howrah": ["Amta", "Bagnan", "Bally", "Domjur", "Jagatballavpur", "Panchla", "Sankrail", "Shyampur", "Udaynarayanpur", "Uluberia"],
    "Hooghly": ["Arambagh", "Balagarh", "Chanditala", "Chinsurah", "Dhaniakhali", "Goghat", "Haripal", "Jangipara", "Khanakul", "Pandua", "Polba Dadpur", "Pursurah", "Singur", "Tarakeswar"],
    "Darjeeling": ["Darjeeling Pulbazar", "Jorebunglow Sukhiapokhri", "Kurseong", "Mirik", "Rangli Rangliot"],
    "Paschim Bardhaman (Durgapur/Asansol)": ["Andal", "Barabani", "Faridpur Durgapur", "Jamuria", "Kanksa", "Pandabeswar", "Raniganj", "Salanpur"]
  },
  "Bihar": {
    "Patna": ["Athmalgola", "Bakhtiarpur", "Barh", "Belchhi", "Bihta", "Bikram", "Danapur", "Daniyawan", "Dulhin Bazar", "Fatuha", "Ghoswari", "Khusrupur", "Maner", "Masaurhi", "Mokama", "Naubatpur", "Paliganj", "Pandarak", "Patna Sadar", "Punpun", "Sampatchak"],
    "Gaya": ["Amas", "Atri", "Bankey Bazar", "Barachatti", "Belaganj", "Bodh Gaya", "Dobhi", "Dumaria", "Fatehpur", "Gaya Sadar", "Guraru", "Gurua", "Imamganj", "Khizirsarai", "Konch", "Manpur", "Mohanpur", "Muhra", "Neemchak Bathani", "Paraiya", "Sherghati", "Tan Kuppa", "Tikari", "Wazirganj"],
    "Muzaffarpur": ["Aurai", "Bandra", "Baruraj", "Bochahan", "Gaighat", "Kanti", "Katra", "Kudra", "Kurhani", "Marwan", "Minapur", "Motipur", "Muraul", "Mushahari", "Paroo", "Sahebganj", "Sakra", "Saraiya"],
    "Bhagalpur": ["Bihpur", "Gopalpur", "Goradih", "Ismailpur", "Jagdishpur", "Kahalgaon", "Kharik", "Narayanpur", "Nathnagar", "Naugachhia", "Pirpainti", "Rangra Chowk", "Sabour", "Sanhaula", "Shahkund", "Sultanganj"],
    "Darbhanga": ["Ali Nagar", "Baheri", "Benipur", "Biraul", "Darbhanga Sadar", "Ghanshyampur", "Hanuman Nagar", "Hayaghat", "Jale", "Keoti", "Kiratpur", "Kusheshwar Asthan", "Manigachhi", "Singhwara", "Tardih"]
  },
  "Gujarat": {
    "Ahmedabad": ["Ahmedabad City", "Bavla", "Daskroi", "Detroj-Rampura", "Dhandhuka", "Dholera", "Dholka", "Mandal", "Sanand", "Viramgam"],
    "Surat": ["Bardoli", "Choryasi", "Kamrej", "Mahuva", "Mandvi", "Mangrol", "Olpad", "Palsana", "Surat City", "Umarpada"],
    "Vadodara": ["Dabhoi", "Desar", "Karjan", "Padra", "Savli", "Shinir", "Vadodara Rural", "Vaghodia"],
    "Rajkot": ["Dhoraji", "Gondal", "Jamkandorna", "Jasdan", "Jetpur", "Kotda Sangani", "Lodhika", "Paddhari", "Rajkot Rural", "Upleta", "Vinchhiya"],
    "Gandhinagar": ["Dehgam", "Gandhinagar", "Kalol", "Mansa"]
  },
  "Rajasthan": {
    "Jaipur": ["Amber", "Bassai", "Chaksu", "Chomu", "Dudu", "Govindgarh", "Jamwa Ramgarh", "Jhotwara", "Kishangarh Renwal", "Kotputli", "Mozmabad", "Paota", "Phagi", "Sambhar", "Sanganer", "Shahpura", "Viratnagar"],
    "Jodhpur": ["Balesar", "Baori", "Bhopalgarh", "Bilara", "Chamu", "Dechu", "Luni", "Mandor", "Osian", "Phalodi", "Piparcity", "Sekhala", "Shergarh", "Tiwari"],
    "Udaipur": ["Badgaon", "Bhinder", "Girwa", "Gogunda", "Jhadol", "Kanore", "Kherwara", "Kotra", "Lasadiya", "Mavli", "Rishabhdeo", "Salumbar", "Sarada", "Sayra", "Vallabhnagar"],
    "Kota": ["Chechat", "Itawa", "Khairabad", "Ladpura", "Sangod", "Sultanpur"],
    "Ajmer": ["Ajmer Rural", "Arain", "Bhinai", "Jawaja", "Kekri", "Masuda", "Peesangan", "Srinagar", "Silora"]
  },
  "Madhya Pradesh": {
    "Bhopal": ["Berasia", "Phanda Urban", "Phanda Rural"],
    "Indore": ["Depalpur", "Indore", "Mhow (Dr. Ambedkar Nagar)", "Sanwer"],
    "Gwalior": ["Bhitarwar", "Dabra", "Ghatigaon", "Gwalior Rural", "Morar"],
    "Jabalpur": ["Kundam", "Majholi", "Panagar", "Patan", "Patan", "Shahpura", "Sihora"],
    "Ujjain": ["Badnagar", "Ghatiya", "Khachrod", "Mahidpur", "Nagda", "Tarana", "Ujjain"]
  },
  "Andhra Pradesh": {
    "Visakhapatnam": ["Anandapuram", "Bheemunipatnam", "Gajuwaka", "Padmanabham", "Pedagantyada", "Pendurthi", "Visakhapatnam Rural", "Visakhapatnam Urban"],
    "Krishna (Vijayawada)": ["Gannavaram", "Gudivada", "Kanchikacherla", "Machilipatnam", "Nandigama", "Nuzvid", "Penamaluru", "Vijayawada Rural", "Vijayawada Urban"],
    "Guntur": ["Amaravati", "Bapatla", "Guntur", "Mangalagiri", "Narasaraopet", "Piduguralla", "Ponnur", "Sattenapalle", "Tenali"],
    "Tirupati (Chittoor)": ["Chandragiri", "Chittoor", "Kalahasti", "Nagari", "Palamaner", "Puttur", "Renigunta", "Srikalahasti", "Tirupati Rural", "Tirupati Urban"]
  },
  "Telangana": {
    "Hyderabad": ["Amberpet", "Asifnagar", "Bahadurpura", "Bandlaguda", "Charminar", "Golconda", "Himayatnagar", "Jubilee Hills", "Khairatabad", "Marredpally", "Musheerabad", "Secunderabad", "Shaikpet"],
    "Ranga Reddy": ["Chevella", "Gandipet", "Hayathnagar", "Ibrahimpatnam", "Maheshwaram", "Rajendranagar", "Saroornagar", "Serilingampally", "Shabad"],
    "Medchal-Malkajgiri": ["Alwal", "Ghatkesar", "Keesara", "Kukatpally", "Malkajgiri", "Medchal", "Quthbullapur"],
    "Warangal": ["Chennaraopet", "Duggondi", "Geesugonda", "Khila Warangal", "Narsampet", "Parvathagiri", "Raiparthy", "Wardhannapet"]
  },
  "Kerala": {
    "Thiruvananthapuram": ["Chirayinkeezhu", "Nedumangad", "Neyyattinkara", "Thiruvananthapuram", "Varkala", "Kattakada"],
    "Ernakulam (Kochi)": ["Aluva", "Kanayannur", "Kochi", "Kothamangalam", "Kunnathunad", "Muvattupuzha", "Paravur"],
    "Kozhikode": ["Kozhikode", "Koyilandy", "Thamarassery", "Vatakara"],
    "Thrissur": ["Chalakkudy", "Chavakkad", "Kodungallur", "Mukundapuram", "Thalapilly", "Thrissur"]
  },
  "Punjab": {
    "Amritsar": ["Ajnala", "Amritsar-I", "Amritsar-II", "Attari", "Chogawan", "Harsha Chhina", "Jandiala Guru", "Majitha", "Rayya", "Tarsikka", "Verka"],
    "Ludhiana": ["Dehlon", "Doraha", "Jagraon", "Khanna", "Ludhiana-1", "Ludhiana-2", "Machhiwara", "Machiwara", "Pakhowal", "Raikot", "Samrala", "Sidhwan Bet", "Sudhar"],
    "Jalandhar": ["Adampur", "Bhogpur", "Jalandhar East", "Jalandhar West", "Lohian", "Mehatpur", "Nakodar", "Nurmahal", "Phillaur", "Rurka Kalan", "Shahkot"],
    "Patiala": ["Bhunerheri", "Ghanaur", "Nabho", "Patiala", "Patran", "Rajpura", "Samana", "Sanaur"]
  },
  "Haryana": {
    "Gurugram (Gurgaon)": ["Farrukhnagar", "Gurugram", "Pataudi", "Sohna"],
    "Faridabad": ["Ballabgarh", "Faridabad", "Tigaon"],
    "Ambala": ["Ambala-I", "Ambala-II", "Barara", "Naraingarh", "Saha", "Shahzadpur"],
    "Hisar": ["Adampur", "Agroha", "Barwala", "Bass", "Hansi-I", "Hansi-II", "Hisar-I", "Hisar-II", "Narnaund", "Uklana"],
    "Karnal": ["Assandh", "Gharaunda", "Indri", "Karnal", "Kunjpura", "Munak", "Nilokheri", "Nissing"]
  },
  "Assam": {
    "Kamrup Metropolitan (Guwahati)": ["Chandrapur", "Dimoria", "Guwahati", "Rani"],
    "Kamrup": ["Boko", "Chaygaon", "Goroimari", "Hajo", "Kamalpur", "Palasbari", "Rangia", "Sualkuchi"],
    "Dibrugarh": ["Barbaruah", "Joypur", "Khowang", "Lahowal", "Panitola", "Tingkhong"],
    "Cachar (Silchar)": ["Banskandi", "Bikrampur", "Katigorah", "Lakhipur", "Narsingpur", "Palonghat", "Raja Bazar", "Salchapra", "Silchar", "Sonai", "Tapang"]
  },
  "Jharkhand": {
    "Ranchi": ["Angara", "Bero", "Bundu", "Burmu", "Chanho", "Itki", "Kanke", "Khalari", "Lapung", "Mandar", "Nagri", "Namkum", "Ormanjhi", "Rahe", "Ratu", "Silli", "Sonahatu", "Tamar"],
    "East Singhbhum (Jamshedpur)": ["Baharagora", "Boram", "Chakulia", "Dhalbhumgarh", "Dumaria", "Ghatshila", "Golmuri Cum Jugsalai", "Gurabandha", "Musabani", "Patamda", "Potka"],
    "Dhanbad": ["Baghmara", "Baliapur", "Dhanbad", "Govindpur", "Nirsa", "Topchanchi", "Tundi"]
  },
  "Chhattisgarh": {
    "Raipur": ["Abhanpur", "Arang", "Dharsiwa", "Tilda"],
    "Durg": ["Bhilai", "Dhamdha", "Durg", "Patan"],
    "Bilaspur": ["Belha", "Bilaspur", "Kota", "Masturi", "Takhatpur"]
  },
  "Himachal Pradesh": {
    "Shimla": ["Chopal", "Jubbal", "Kotkhai", "Kumarsain", "Mashobra", "Nankhari", "Narkanda", "Rampur", "Rohru", "Shimla Rural", "Theog"],
    "Kangra (Dharamshala)": ["Baijnath", "Bhadwar", "Dehra", "Dharamshala", "Fatehpur", "Indora", "Jaisinghpur", "Kangra", "Nagrota Bagwan", "Nurpur", "Palampur", "Rait", "Suliali"]
  },
  "Uttarakhand": {
    "Dehradun": ["Chakrata", "Doiwala", "Kalsi", "Raipur", "Sahaspur", "Vikasnagar"],
    "Haridwar": ["Bahadrabad", "Bhagwanpur", "Khanpur", "Laksar", "Narsan", "Roorkee"],
    "Nainital": ["Bhimtal", "Betalghat", "Dhari", "Haldwani", "Kotabagh", "Okhalkanda", "Ramnagar"]
  },
  "Goa": {
    "North Goa": ["Bardez (Mapusa)", "Bicholim", "Pernem", "Ponda", "Sattari", "Tiswadi (Panaji)"],
    "South Goa": ["Canacona", "Mormugao (Vasco)", "Salcete (Margao)", "Quepem", "Sanguem", "Dharbandora"]
  },
  "Jammu and Kashmir": {
    "Srinagar": ["Eidgah", "Khanyar", "Pantha Chowk", "Srinagar Central", "Srinagar North", "Srinagar South"],
    "Jammu": ["Akhnoor", "Bahu", "Bishnah", "Dansal", "Jammu", "Marh", "Nagrota", "RS Pura", "Suchetgarh"]
  },
  "Ladakh": {
    "Leh": ["Chuchot", "Diskit", "Durbuk", "Khaltsi", "Kharu", "Leh", "Nyoma", "Panamik", "Saspol", "Singay Lalok"],
    "Kargil": ["Drass", "Kargil", "Sankoo", "Shakar Chiktan", "Shargole", "Tai Suru", "Zanskar"]
  },
  "Tripura": {
    "West Tripura (Agartala)": ["Belonia", "Bishalgarh", "Dukli", "Hezamara", "Jirania", "Mandwi", "Mohanpur", "Old Agartala"],
    "Gomati": ["Amarpur", "Kakraban", "Karbook", "Killa", "Matabari", "Ompi", "Tepania"]
  },
  "Meghalaya": {
    "East Khasi Hills (Shillong)": ["Khatarshnong Laitkroh", "Mawkynrew", "Mawphlang", "Mawryngkneng", "Mylliem", "Pynursla", "Shella Bholaganj"],
    "West Garo Hills (Tura)": ["Dalu", "Demdema", "Gambegre", "Rongram", "Selsella", "Tikrikilla"]
  },
  "Manipur": {
    "Imphal West": ["Haorangsabal", "Lamshang", "Patsoi", "Wangoi"],
    "Imphal East": ["Keirao Bitra", "Porompat", "Sawombung"]
  },
  "Nagaland": {
    "Kohima": ["Chiephobozou", "Jakhama", "Kohima Sadar", "Sechu-Zubza", "Tseminyu"],
    "Dimapur": ["Chumukedima", "Dhansiripar", "Dimapur Sadar", "Kuhuboto", "Medziphema", "Niuland"]
  },
  "Mizoram": {
    "Aizawl": ["Aibawk", "Darlawn", "Phullen", "Thingsulthliah", "Tlangnuam"],
    "Lunglei": ["Bunghmun", "Hnahthial", "Lunglei", "Lungsen"]
  },
  "Arunachal Pradesh": {
    "Papum Pare (Itanagar)": ["Balijan", "Doimukh", "Itanagar", "Kimim", "Mengio", "Naharlagun", "Sagalee"],
    "Changlang": ["Bordumsa", "Changlang", "Diyun", "Jairampur", "Miao", "Nampong"]
  },
  "Sikkim": {
    "East Sikkim (Gangtok)": ["Duga", "Gangtok", "Khamdong", "Martam", "Pakyong", "Parakha", "Rakdong Tintek", "Ranka", "Regu", "Rhenock"],
    "South Sikkim (Namchi)": ["Jorethang", "Namchi", "Ravangla", "Sikip", "Temi Tarku", "Yangang"]
  },
  "Andaman and Nicobar Islands": {
    "South Andaman": ["Ferrargunj", "Little Andaman", "Port Blair", "Prothrapur"],
    "North and Middle Andaman": ["Diglipur", "Mayabunder", "Rangat"]
  },
  "Chandigarh": {
    "Chandigarh": ["Sector 1-10", "Sector 11-20", "Sector 21-30", "Sector 31-40", "Sector 41-50", "Manimajra", "Industrial Area"]
  },
  "Dadra and Nagar Haveli and Daman and Diu": {
    "Daman": ["Daman", "Moti Daman", "Nani Daman"],
    "Diu": ["Diu"],
    "Dadra and Nagar Haveli": ["Silvassa", "Dadra", "Khanvel"]
  },
  "Lakshadweep": {
    "Lakshadweep": ["Agatti", "Amini", "Andrott", "Bitra", "Chetlat", "Kadmat", "Kalpeni", "Kavaratti", "Kiltan", "Minicoy"]
  },
  "Puducherry": {
    "Puducherry": ["Ariyankuppam", "Bahour", "Mannadipet", "Ozhukarai", "Puducherry", "Villianur"],
    "Karaikal": ["Karaikal", "Kottucherry", "Nedungadu", "Neravy", "Thirunallar", "TR Pattinam"]
  }
};

/**
 * Returns list of all States & Union Territories of India (alphabetically sorted).
 */
export function getIndiaStates(): string[] {
  return Object.keys(INDIA_LOCATIONS).sort((a, b) => a.localeCompare(b));
}

/**
 * Returns list of districts for a given state.
 */
export function getDistrictsForState(stateName: string): string[] {
  if (!stateName || !INDIA_LOCATIONS[stateName]) return [];
  return Object.keys(INDIA_LOCATIONS[stateName]).sort((a, b) => a.localeCompare(b));
}

/**
 * Returns list of blocks for a given state & district.
 */
export function getBlocksForDistrict(stateName: string, districtName: string): string[] {
  if (!stateName || !districtName || !INDIA_LOCATIONS[stateName]?.[districtName]) return [];
  return [...INDIA_LOCATIONS[stateName][districtName]].sort((a, b) => a.localeCompare(b));
}
