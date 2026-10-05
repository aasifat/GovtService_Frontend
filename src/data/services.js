// Amar Sheba content: the 7 government services, their guides, steps,
// documents, fees and FAQs, plus the home page's "people often ask" chips.
// All facts here are SAMPLE data for the capstone demo -- verify every fee,
// time and step against the official portal before this goes live.
// Text pairs are [bangla, english]; see src/utils/lang.js `pick()`.

// Amar Sheba demo content. All facts are SAMPLE data for the capstone demo;
// verify every fee, time and step against the official portal before launch.
// Text pairs are [bangla, english].

export const SERVICES = [
  {
    id: "nid", icon: "idcard",
    name: ["জাতীয় পরিচয়পত্র", "National ID (NID)"],
    desc: ["নতুন নিবন্ধন ও তথ্য সংশোধন", "New registration and corrections"],
    aliases: ["nid", "এনআইডি", "জাতীয় পরিচয়", "পরিচয়পত্র", "ভোটার", "voter", "id card", "smart card", "স্মার্ট কার্ড", "national id"],
    guides: [
      {
        id: "nid-apply",
        title: ["নতুন এনআইডি নিবন্ধন", "New NID registration"],
        intro: ["নির্বাচন কমিশনের অনলাইন পোর্টালে নিবন্ধন করে, পরে উপজেলা বা থানা নির্বাচন অফিসে ছবি ও আঙুলের ছাপ দিয়ে নতুন এনআইডি পাওয়া যায়।", "Register on the Election Commission portal, then give your photo and fingerprints at the upazila or thana election office to get a new NID."],
        keys: ["new", "notun", "নতুন", "apply", "আবেদন", "nibondhon", "নিবন্ধন", "register", "voter"],
        time: ["বায়োমেট্রিকের পর প্রায় ১–২ মাস", "About 1–2 months after biometrics"],
        feeShort: ["বিনামূল্যে", "Free"],
        portal: "https://services.nidw.gov.bd",
        docs: [
          ["অনলাইন জন্ম নিবন্ধন সনদ", "Online birth registration certificate"],
          ["এসএসসি বা সমমান সনদ (থাকলে)", "SSC or equivalent certificate (if any)"],
          ["পিতা ও মাতার এনআইডির কপি", "Copies of both parents' NIDs"],
          ["ঠিকানার প্রমাণ: বিদ্যুৎ বা পানির বিল, হোল্ডিং ট্যাক্স রশিদ", "Address proof: electricity or water bill, holding tax receipt"],
          ["ওয়ার্ড বা ইউনিয়ন পরিষদের নাগরিকত্ব সনদ", "Citizenship certificate from the ward or union council"]
        ],
        fees: { head: [["সেবা", "Service"], ["ফি", "Fee"]], rows: [[["নতুন নিবন্ধন", "New registration"], ["বিনামূল্যে", "Free"]], [["প্রথম এনআইডি কার্ড", "First NID card"], ["বিনামূল্যে", "Free"]]] },
        steps: [
          [["পোর্টালে যান", "Open the portal"], ["services.nidw.gov.bd তে গিয়ে 'নতুন নিবন্ধন' বেছে নিন।", "Go to services.nidw.gov.bd and choose 'New registration'."]],
          [["জন্ম নিবন্ধন নম্বর দিন", "Enter birth registration number"], ["জন্ম নিবন্ধন নম্বর, জন্ম তারিখ ও মোবাইল নম্বর দিয়ে OTP যাচাই করুন।", "Enter your birth registration number, date of birth and mobile number, then verify the OTP."]],
          [["ফরম পূরণ করুন", "Fill in the form"], ["ব্যক্তিগত তথ্য, পিতা-মাতার তথ্য ও স্থায়ী-বর্তমান ঠিকানা সঠিকভাবে লিখুন।", "Fill in your personal details, parents' details and permanent and present address."]],
          [["কাগজপত্র আপলোড করুন", "Upload documents"], ["জন্ম নিবন্ধন সনদ, ঠিকানার প্রমাণ ও অন্যান্য কাগজের স্ক্যান কপি যুক্ত করুন।", "Attach scans of your birth certificate, address proof and other documents."]],
          [["জমা দিয়ে ফরম ডাউনলোড করুন", "Submit and download the form"], ["জমা দেওয়ার পর ফরম নম্বরসহ কপি ডাউনলোড করে রাখুন।", "After submitting, download the copy with your form number."]],
          [["বায়োমেট্রিক দিন", "Give biometrics"], ["নির্ধারিত দিনে উপজেলা বা থানা নির্বাচন অফিসে ছবি, আঙুলের ছাপ ও চোখের আইরিস দিন।", "On the given date, visit the upazila or thana election office for photo, fingerprints and iris scan."]]
        ],
        faqs: [
          [["কত বছর বয়সে এনআইডি করা যায়?", "At what age can I get an NID?"], ["১৮ বছর হলে ভোটার হিসেবে নিবন্ধন করা যায়; ১৬ বছর বয়স থেকে অগ্রিম নিবন্ধনের সুযোগ আছে।", "You register as a voter at 18; pre-registration is possible from age 16."]],
          [["এনআইডির অনলাইন কপি কীভাবে পাব?", "How do I get the online copy of my NID?"], ["নিবন্ধন সম্পন্ন হলে services.nidw.gov.bd তে লগইন করে এনআইডির অনলাইন কপি ডাউনলোড করা যায়।", "Once registration is complete, log in to services.nidw.gov.bd and download the online copy."]]
        ]
      },
      {
        id: "nid-correction",
        title: ["এনআইডি তথ্য সংশোধন", "NID correction"],
        intro: ["নাম, জন্ম তারিখ, ঠিকানা বা অন্য তথ্যে ভুল থাকলে অনলাইনে প্রমাণসহ সংশোধনের আবেদন করা যায়।", "If your name, date of birth, address or other details are wrong, you can apply online for a correction with proof."],
        keys: ["correction", "সংশোধন", "songshodhon", "shongshodhon", "vul", "ভুল", "change", "পরিবর্তন", "edit", "thik", "ঠিক"],
        time: ["প্রায় ১৫–৪৫ কার্যদিবস", "About 15–45 working days"],
        feeShort: ["৳২৩০ থেকে", "From ৳230"],
        portal: "https://services.nidw.gov.bd",
        docs: [
          ["বর্তমান এনআইডির কপি", "Copy of your current NID"],
          ["সঠিক তথ্যের প্রমাণ: এসএসসি সনদ বা জন্ম নিবন্ধন", "Proof of the correct details: SSC certificate or birth registration"],
          ["নাম পরিবর্তনে এফিডেভিট বা গেজেট (প্রযোজ্য হলে)", "Affidavit or gazette for a name change (if applicable)"],
          ["বিবাহজনিত পরিবর্তনে কাবিননামা", "Marriage certificate (kabinnama) for changes after marriage"]
        ],
        fees: { head: [["আবেদন", "Application"], ["ফি (ভ্যাটসহ)", "Fee (incl. VAT)"]], rows: [[["প্রথমবার সংশোধন", "First correction"], ["৳২৩০", "৳230"]], [["দ্বিতীয়বার সংশোধন", "Second correction"], ["৳৩৪৫", "৳345"]], [["তৃতীয়বার বা তার বেশি", "Third time or more"], ["৳৪৬০", "৳460"]]] },
        steps: [
          [["পোর্টালে লগইন করুন", "Log in to the portal"], ["services.nidw.gov.bd তে এনআইডি নম্বর ও পাসওয়ার্ড দিয়ে প্রোফাইলে ঢুকুন।", "Log in to services.nidw.gov.bd with your NID number and password."]],
          [["'সংশোধন' মেনু খুলুন", "Open the 'Correction' menu"], ["ড্যাশবোর্ডের এডিট আইকনে ক্লিক করে সংশোধনযোগ্য তথ্যগুলো দেখুন।", "Click the edit icon on the dashboard to see which fields can be corrected."]],
          [["ভুল তথ্য নির্বাচন করুন", "Select what to correct"], ["নাম, ঠিকানা বা জন্ম তারিখের মধ্যে যেটি বদলাতে চান তা বেছে সঠিক তথ্য লিখুন।", "Choose the field to change and type the correct details."]],
          [["প্রমাণপত্র আপলোড করুন", "Upload proof"], ["এসএসসি সনদ বা জন্ম নিবন্ধনের মতো প্রমাণপত্রের স্ক্যান যুক্ত করুন।", "Attach scans of proof such as your SSC certificate or birth registration."]],
          [["ফি পরিশোধ করুন", "Pay the fee"], ["বিকাশ, নগদ বা কার্ডে নির্ধারিত ফি দিয়ে আবেদন সম্পন্ন করুন।", "Pay the fee with bKash, Nagad or card to complete the application."]],
          [["অবস্থা দেখুন", "Track the status"], ["ড্যাশবোর্ডের 'আবেদনের অবস্থা' থেকে অগ্রগতি দেখুন; দরকার হলে শুনানিতে ডাকা হতে পারে।", "Follow progress under 'Application status'; you may be called for a hearing."]]
        ],
        faqs: [
          [["জন্ম তারিখ কি সংশোধন করা যায়?", "Can I correct my date of birth?"], ["হ্যাঁ, তবে শক্ত প্রমাণ (যেমন এসএসসি সনদ) লাগে এবং ক্ষেত্রবিশেষে শুনানিতে যেতে হয়।", "Yes, but you need strong proof such as an SSC certificate, and you may be called for a hearing."]],
          [["সংশোধনের আবেদন কতবার করা যায়?", "How many times can I apply for correction?"], ["একাধিকবার করা যায়, তবে প্রতিবার ফি বাড়ে।", "You can apply more than once, but the fee increases each time."]]
        ]
      }
    ]
  },
  {
    id: "passport", icon: "passport",
    name: ["পাসপোর্ট", "Passport"],
    desc: ["নতুন ই-পাসপোর্টের আবেদন", "Apply for a new e-Passport"],
    aliases: ["passport", "pasport", "e passport", "epassport", "পাসপোর্ট", "ই পাসপোর্ট"],
    guides: [
      {
        id: "passport-new",
        title: ["নতুন ই-পাসপোর্ট", "New e-Passport"],
        intro: ["অনলাইনে ফরম পূরণ ও ফি পরিশোধের পর আঞ্চলিক পাসপোর্ট অফিসে বায়োমেট্রিক দিলে ই-পাসপোর্ট তৈরি হয়।", "Fill in the form and pay online, then give biometrics at your regional passport office to get an e-Passport."],
        keys: ["new", "notun", "নতুন", "apply", "আবেদন", "e passport"],
        time: ["রেগুলার প্রায় ১৫, এক্সপ্রেস ৭, সুপার এক্সপ্রেস ২ কার্যদিবস", "Regular about 15, express 7, super express 2 working days"],
        feeShort: ["৳৪,০২৫ থেকে", "From ৳4,025"],
        portal: "https://www.epassport.gov.bd",
        docs: [
          ["এনআইডি (১৮ বছরের বেশি) বা অনলাইন জন্ম নিবন্ধন (১৮ বছরের কম)", "NID (over 18) or online birth registration (under 18)"],
          ["অনলাইন ফি পরিশোধের রশিদ", "Online fee payment receipt"],
          ["আবেদনের সারাংশ ও অ্যাপয়েন্টমেন্ট স্লিপ", "Application summary and appointment slip"],
          ["সরকারি চাকরিজীবীদের জন্য NOC বা GO", "NOC or GO for government employees"],
          ["পুরনো পাসপোর্ট (থাকলে)", "Old passport (if any)"]
        ],
        fees: { head: [["৪৮ পাতা, ডেলিভারি", "48 pages, delivery"], ["৫ বছর", "5 years"], ["১০ বছর", "10 years"]], rows: [
          [["রেগুলার", "Regular"], ["৳৪,০২৫", "৳4,025"], ["৳৫,৭৫০", "৳5,750"]],
          [["এক্সপ্রেস", "Express"], ["৳৬,৩২৫", "৳6,325"], ["৳৮,০৫০", "৳8,050"]],
          [["সুপার এক্সপ্রেস", "Super express"], ["৳৮,৬২৫", "৳8,625"], ["৳১০,৩৫০", "৳10,350"]]
        ] },
        steps: [
          [["epassport.gov.bd তে যান", "Go to epassport.gov.bd"], ["নিজের জেলা ও পাসপোর্ট অফিস নির্বাচন করে অ্যাকাউন্ট খুলুন।", "Choose your district and passport office, then create an account."]],
          [["অনলাইন ফরম পূরণ করুন", "Fill in the online form"], ["এনআইডি অনুযায়ী ব্যক্তিগত তথ্য, ঠিকানা ও জরুরি যোগাযোগ দিন।", "Enter your personal details, address and emergency contact exactly as on your NID."]],
          [["পাতা, মেয়াদ ও ডেলিভারি বাছুন", "Choose pages, validity and delivery"], ["৪৮ বা ৬৪ পাতা, ৫ বা ১০ বছর মেয়াদ এবং রেগুলার/এক্সপ্রেস ডেলিভারি বেছে নিন।", "Pick 48 or 64 pages, 5 or 10 years, and regular or express delivery."]],
          [["অনলাইনে ফি দিন", "Pay the fee online"], ["ই-পেমেন্টে ফি পরিশোধ করে রশিদ সংরক্ষণ করুন।", "Pay with e-payment and keep the receipt."]],
          [["অ্যাপয়েন্টমেন্ট নিন", "Book an appointment"], ["সুবিধামতো তারিখ বেছে আবেদন সারাংশ প্রিন্ট করুন।", "Pick a date and print the application summary."]],
          [["বায়োমেট্রিক দিন", "Give biometrics"], ["নির্ধারিত দিনে কাগজপত্রসহ আঞ্চলিক পাসপোর্ট অফিসে ছবি ও আঙুলের ছাপ দিন।", "On your date, bring your documents to the regional passport office for photo and fingerprints."]],
          [["পাসপোর্ট সংগ্রহ করুন", "Collect your passport"], ["এসএমএস পেলে ডেলিভারি স্লিপ নিয়ে অফিস থেকে পাসপোর্ট সংগ্রহ করুন।", "When you get the SMS, collect it from the office with your delivery slip."]]
        ],
        faqs: [
          [["পুলিশ ভেরিফিকেশন কি লাগে?", "Is police verification needed?"], ["নতুন আবেদনে সাধারণত পুলিশ ভেরিফিকেশন হয়; পুলিশ আপনার সাথে যোগাযোগ করবে।", "New applications usually go through police verification; the police will contact you."]],
          [["১৮ বছরের কম বয়সীরা কত বছরের পাসপোর্ট পায়?", "What validity do under-18 applicants get?"], ["১৮ বছরের কম হলে শুধু ৫ বছর মেয়াদি পাসপোর্ট দেওয়া হয়।", "Applicants under 18 get only the 5-year passport."]]
        ]
      }
    ]
  },
  {
    id: "driving", icon: "car",
    name: ["ড্রাইভিং লাইসেন্স", "Driving License"],
    desc: ["লার্নার থেকে স্মার্ট কার্ড লাইসেন্স", "From learner card to smart card license"],
    aliases: ["driving", "license", "licence", "lisens", "লাইসেন্স", "ড্রাইভিং", "brta", "বিআরটিএ", "learner", "লার্নার", "gari", "গাড়ি", "bike", "মোটরসাইকেল"],
    guides: [
      {
        id: "dl-apply",
        title: ["ড্রাইভিং লাইসেন্সের আবেদন", "Apply for a driving license"],
        intro: ["বিআরটিএ সার্ভিস পোর্টালে লার্নার কার্ডের আবেদন করে, পরীক্ষায় পাস করার পর স্মার্ট কার্ড লাইসেন্স পাওয়া যায়।", "Apply for a learner card on the BRTA service portal, pass the tests, then get your smart card license."],
        keys: ["apply", "আবেদন", "new", "learner", "লার্নার"],
        time: ["লার্নার পাওয়ার পর পরীক্ষা পর্যন্ত প্রায় ২–৩ মাস", "About 2–3 months from learner card to test"],
        feeShort: ["লার্নার ৳৩৪৫ থেকে", "Learner from ৳345"],
        portal: "https://bsp.brta.gov.bd",
        docs: [
          ["এনআইডি", "NID"],
          ["নিবন্ধিত চিকিৎসকের মেডিকেল সার্টিফিকেট", "Medical certificate from a registered doctor"],
          ["সাম্প্রতিক ছবি", "Recent photo"],
          ["বর্তমান ঠিকানার প্রমাণ (এনআইডির ঠিকানা ভিন্ন হলে)", "Present address proof (if different from NID)"],
          ["পরীক্ষার দিন লার্নার কার্ড", "Learner card on the test day"]
        ],
        fees: { head: [["ধরন", "Type"], ["ফি", "Fee"]], rows: [
          [["লার্নার (এক শ্রেণি)", "Learner (one class)"], ["৳৩৪৫", "৳345"]],
          [["লার্নার (মোটরসাইকেল + হালকা গাড়ি)", "Learner (motorcycle + light vehicle)"], ["৳৫১৮", "৳518"]],
          [["স্মার্ট কার্ড, পেশাদার (৫ বছর)", "Smart card, professional (5 years)"], ["৳২,৫৪২", "৳2,542"]],
          [["স্মার্ট কার্ড, অপেশাদার (১০ বছর)", "Smart card, non-professional (10 years)"], ["৳৪,৪৯৭", "৳4,497"]]
        ] },
        steps: [
          [["bsp.brta.gov.bd তে অ্যাকাউন্ট খুলুন", "Create an account on bsp.brta.gov.bd"], ["মোবাইল নম্বর ও এনআইডি দিয়ে বিআরটিএ সার্ভিস পোর্টালে নিবন্ধন করুন।", "Register on the BRTA service portal with your mobile number and NID."]],
          [["লার্নার ফরম পূরণ করুন", "Fill in the learner form"], ["গাড়ির শ্রেণি (মোটরসাইকেল/হালকা গাড়ি) বেছে ব্যক্তিগত তথ্য দিন।", "Pick the vehicle class (motorcycle or light vehicle) and enter your details."]],
          [["মেডিকেল সার্টিফিকেট দিন", "Add the medical certificate"], ["নির্ধারিত ফরম্যাটের মেডিকেল সার্টিফিকেট আপলোড করুন।", "Upload the medical certificate in the required format."]],
          [["ফি দিয়ে লার্নার নিন", "Pay and get the learner card"], ["অনলাইনে ফি দিলে লার্নার কার্ড ও পরীক্ষার তারিখ পাবেন।", "Pay online to get your learner card and test date."]],
          [["পরীক্ষা দিন", "Take the tests"], ["নির্ধারিত সার্কেল অফিসে লিখিত, মৌখিক ও মাঠ পরীক্ষা দিন।", "Take the written, oral and field tests at your BRTA circle office."]],
          [["স্মার্ট কার্ড নিন", "Collect the smart card"], ["পাস করলে ফি দিয়ে বায়োমেট্রিক দিন; এসএমএস পেলে কার্ড সংগ্রহ করুন।", "After passing, pay the fee and give biometrics; collect the card when you get the SMS."]]
        ],
        faqs: [
          [["লার্নার কার্ডের মেয়াদ কত?", "How long is a learner card valid?"], ["লার্নার কার্ড সাধারণত ৩ মাস বৈধ থাকে; এর মধ্যে পরীক্ষা দিতে হয়।", "A learner card is usually valid for 3 months; take the test within that time."]],
          [["কী কী পরীক্ষা হয়?", "Which tests are there?"], ["লিখিত, মৌখিক ও মাঠ (ব্যবহারিক) পরীক্ষা হয়।", "There is a written test, an oral test and a field (practical) test."]]
        ]
      }
    ]
  },
  {
    id: "landtax", icon: "map",
    name: ["ভূমি উন্নয়ন কর", "Land Development Tax"],
    desc: ["অনলাইনে খাজনা ও ই-দাখিলা", "Pay land tax online, get e-dakhila"],
    aliases: ["land tax", "land", "khajna", "khazna", "খাজনা", "ভূমি", "জমি", "jomi", "dakhila", "দাখিলা", "ldtax", "khatian", "খতিয়ান"],
    guides: [
      {
        id: "ldt-pay",
        title: ["অনলাইনে খাজনা পরিশোধ", "Pay land tax online"],
        intro: ["ldtax.gov.bd তে হোল্ডিং যুক্ত করে অনলাইনে ভূমি উন্নয়ন কর দিলে সাথে সাথে QR কোডসহ ই-দাখিলা পাওয়া যায়।", "Add your holding on ldtax.gov.bd and pay land development tax online to get an e-dakhila with a QR code right away."],
        keys: ["pay", "পরিশোধ", "দিব", "debo", "dibo", "online", "অনলাইন"],
        time: ["হোল্ডিং অনুমোদনের পর তাৎক্ষণিক", "Instant once the holding is approved"],
        feeShort: ["জমির শ্রেণিভেদে", "Depends on land class"],
        portal: "https://ldtax.gov.bd",
        docs: [
          ["এনআইডি ও নিজের নামের মোবাইল নম্বর", "NID and a mobile number in your name"],
          ["খতিয়ান ও দাগ নম্বর", "Khatian and dag numbers"],
          ["মৌজা ও উপজেলার নাম", "Mouza and upazila name"],
          ["সর্বশেষ দাখিলা (থাকলে)", "Latest dakhila (if any)"]
        ],
        fees: { head: [["জমি", "Land"], ["কর", "Tax"]], rows: [
          [["২৫ বিঘা পর্যন্ত কৃষি জমি", "Agricultural land up to 25 bighas"], ["মওকুফ", "Exempt"]],
          [["অন্যান্য জমি", "Other land"], ["শ্রেণি ও এলাকাভেদে নির্ধারিত; পোর্টাল হিসাব দেখায়", "Set by land class and area; the portal calculates it"]],
          [["অনলাইন পরিশোধ", "Paying online"], ["অতিরিক্ত সার্ভিস চার্জ প্রযোজ্য হতে পারে", "A small service charge may apply"]]
        ] },
        steps: [
          [["নিবন্ধন করুন", "Register"], ["ldtax.gov.bd তে এনআইডি, জন্ম তারিখ ও মোবাইল নম্বর দিয়ে OTP যাচাই করুন।", "On ldtax.gov.bd, register with NID, date of birth and mobile, and verify the OTP."]],
          [["হোল্ডিং যুক্ত করুন", "Add your holding"], ["মৌজা, খতিয়ান ও দাগ নম্বর দিয়ে জমির তথ্য যাচাইয়ের জন্য জমা দিন।", "Enter mouza, khatian and dag numbers and submit the land for verification."]],
          [["অনুমোদনের অপেক্ষা করুন", "Wait for approval"], ["ইউনিয়ন ভূমি অফিস তথ্য যাচাই করে হোল্ডিং অনুমোদন দেবে।", "The union land office checks the details and approves the holding."]],
          [["বকেয়া ও চলতি কর দেখুন", "Check arrears and current tax"], ["অনুমোদনের পর পোর্টালে বকেয়াসহ মোট করের হিসাব দেখা যাবে।", "After approval the portal shows the total tax including arrears."]],
          [["অনলাইনে পরিশোধ করুন", "Pay online"], ["বিকাশ, নগদ, রকেট, কার্ড বা ব্যাংকে কর পরিশোধ করুন।", "Pay with bKash, Nagad, Rocket, card or bank."]],
          [["ই-দাখিলা ডাউনলোড করুন", "Download the e-dakhila"], ["QR কোডসহ দাখিলা ডাউনলোড বা প্রিন্ট করে রাখুন।", "Download or print the dakhila with its QR code."]]
        ],
        faqs: [
          [["হোল্ডিং অনুমোদনে কত দিন লাগে?", "How long does holding approval take?"], ["ইউনিয়ন ভূমি অফিসের যাচাইয়ের ওপর নির্ভর করে; সাধারণত কয়েক দিন লাগে।", "It depends on the union land office's check; usually a few days."]],
          [["অনলাইন দাখিলা কি বৈধ?", "Is the online dakhila valid?"], ["হ্যাঁ, QR কোডসহ ই-দাখিলা বৈধ এবং QR স্ক্যান করে যাচাই করা যায়।", "Yes, the e-dakhila with QR code is valid and can be verified by scanning it."]]
        ]
      }
    ]
  },
  {
    id: "gd", icon: "shield",
    name: ["অনলাইন জিডি", "Online GD"],
    desc: ["হারানো কাগজ বা জিনিসের জিডি", "General diary for lost documents or items"],
    aliases: ["gd", "জিডি", "general diary", "সাধারণ ডায়েরি", "lost", "harano", "haray", "hariye", "হারানো", "হারিয়ে", "হারিয়েছে", "police", "পুলিশ", "thana", "থানা"],
    guides: [
      {
        id: "gd-file",
        title: ["হারানো জিনিসের অনলাইন জিডি", "File an online GD for lost items"],
        intro: ["পাসপোর্ট, এনআইডি, সনদ বা মোবাইল হারালে থানায় না গিয়েও অনলাইনে জিডি করা যায়; পুলিশ যাচাই করে QR কোডসহ কপি দেয়।", "If you lose a passport, NID, certificate or phone, you can file a GD online without going to the police station; police verify it and issue a copy with a QR code."],
        keys: ["file", "করব", "korbo", "apply", "lost", "হারানো"],
        time: ["জমার পর সাধারণত ১–৩ দিনে যাচাই", "Usually verified within 1–3 days"],
        feeShort: ["বিনামূল্যে", "Free"],
        portal: "https://gd.police.gov.bd",
        docs: [
          ["এনআইডি", "NID"],
          ["নিজের নামে নিবন্ধিত মোবাইল নম্বর", "Mobile number registered in your name"],
          ["হারানো জিনিসের বিবরণ: নম্বর, কোথায়, কখন", "Details of the lost item: number, where, when"],
          ["সম্ভব হলে হারানো নথির ফটোকপি", "A photocopy of the lost document, if you have one"]
        ],
        fees: { head: [["সেবা", "Service"], ["ফি", "Fee"]], rows: [[["অনলাইন জিডি", "Online GD"], ["বিনামূল্যে", "Free"]]] },
        steps: [
          [["পোর্টাল বা অ্যাপ খুলুন", "Open the portal or app"], ["gd.police.gov.bd অথবা 'Online GD' অ্যাপে যান।", "Go to gd.police.gov.bd or the 'Online GD' app."]],
          [["নিবন্ধন করুন", "Register"], ["এনআইডি ও মোবাইল নম্বর দিয়ে OTP যাচাই করে অ্যাকাউন্ট খুলুন।", "Create an account with your NID and mobile number and verify the OTP."]],
          [["জিডির ধরন বাছুন", "Choose the GD type"], ["'হারানো' নির্বাচন করে কোন নথি বা জিনিস হারিয়েছে তা বেছে নিন।", "Select 'Lost' and choose which document or item you lost."]],
          [["বিবরণ দিন", "Describe what happened"], ["কী হারিয়েছে, কোথায়, কখন এবং সংশ্লিষ্ট থানার নাম লিখুন।", "Write what was lost, where, when, and the relevant police station."]],
          [["জমা দিন", "Submit"], ["জমা দিয়ে ট্র্যাকিং নম্বর সংরক্ষণ করুন।", "Submit and save your tracking number."]],
          [["জিডির কপি ডাউনলোড করুন", "Download the GD copy"], ["পুলিশ যাচাই করে অনুমোদন দিলে QR কোডসহ কপি ডাউনলোড করুন।", "When police approve it, download the copy with its QR code."]]
        ],
        faqs: [
          [["কোন কোন জিনিস হারালে অনলাইন জিডি করা যায়?", "Which lost items can I report online?"], ["পাসপোর্ট, এনআইডি, সনদ, ড্রাইভিং লাইসেন্স, মোবাইল ফোন, চেক বইসহ নানা নথি ও জিনিস।", "Passports, NIDs, certificates, driving licenses, mobile phones, cheque books and more."]],
          [["থানায় কি যেতে হবে?", "Do I have to go to the police station?"], ["সাধারণত না; প্রয়োজন হলে থানা থেকে ফোনে যোগাযোগ করা হবে।", "Usually not; the station will call you if they need more details."]]
        ]
      }
    ]
  },
  {
    id: "ereturn", icon: "receipt",
    name: ["ই-রিটার্ন", "Income Tax e-Return"],
    desc: ["অনলাইনে আয়কর রিটার্ন জমা", "File your income tax return online"],
    aliases: ["e return", "ereturn", "return", "রিটার্ন", "ই রিটার্ন", "income tax", "tax", "আয়কর", "কর", "tin", "etin", "ই টিন", "nbr"],
    guides: [
      {
        id: "return-file",
        title: ["অনলাইনে রিটার্ন জমা", "File your return online"],
        intro: ["etaxnbr.gov.bd তে আয়, বিনিয়োগ ও সম্পদের তথ্য দিয়ে কর হিসাব করে অনলাইনে রিটার্ন জমা ও কর পরিশোধ করা যায়।", "On etaxnbr.gov.bd you enter income, investments and assets, see your tax calculated, pay it and submit the return online."],
        keys: ["file", "জমা", "joma", "submit", "return"],
        time: ["জমার সাথে সাথে স্বীকৃতিপত্র; সাধারণ সময়সীমা ৩০ নভেম্বর", "Acknowledgement right after submitting; the usual deadline is 30 November"],
        feeShort: ["জমা বিনামূল্যে", "Filing is free"],
        portal: "https://etaxnbr.gov.bd",
        docs: [
          ["ই-টিআইএন সার্টিফিকেট", "e-TIN certificate"],
          ["এনআইডি দিয়ে নিবন্ধিত নিজের মোবাইল নম্বর", "Mobile number registered with your NID"],
          ["বেতন সনদ বা আয়ের বিবরণ", "Salary certificate or income statement"],
          ["ব্যাংক স্টেটমেন্ট ও বিনিয়োগের প্রমাণ (সঞ্চয়পত্র, ডিপিএস)", "Bank statements and investment proof (savings certificates, DPS)"],
          ["সম্পদ ও দায়ের তথ্য", "Details of assets and liabilities"]
        ],
        fees: { head: [["বিষয়", "Item"], ["পরিমাণ", "Amount"]], rows: [
          [["রিটার্ন জমা", "Filing the return"], ["বিনামূল্যে", "Free"]],
          [["করমুক্ত আয়সীমা (সাধারণ করদাতা)", "Tax-free income limit (general)"], ["৳৩,৫০,০০০", "৳350,000"]],
          [["ন্যূনতম কর", "Minimum tax"], ["এলাকাভেদে ৳৩,০০০–৫,০০০", "৳3,000–5,000 by area"]]
        ] },
        steps: [
          [["নিবন্ধন করুন", "Register"], ["etaxnbr.gov.bd তে টিআইএন ও এনআইডি-নিবন্ধিত মোবাইল দিয়ে অ্যাকাউন্ট খুলুন।", "Create an account on etaxnbr.gov.bd with your TIN and NID-registered mobile."]],
          [["আয়ের তথ্য দিন", "Enter your income"], ["বেতন, ব্যবসা, ভাড়া বা অন্যান্য উৎসের আয় লিখুন।", "Enter income from salary, business, rent or other sources."]],
          [["বিনিয়োগ যুক্ত করুন", "Add investments"], ["রেয়াত পেতে সঞ্চয়পত্র, ডিপিএস, বিমা ইত্যাদির তথ্য দিন।", "Add savings certificates, DPS, insurance and so on to get a rebate."]],
          [["সম্পদ ও দায় লিখুন", "Enter assets and liabilities"], ["ব্যাংক জমা, জমি, গাড়ি ও ঋণের তথ্য দিন।", "Enter bank balances, land, vehicles and loans."]],
          [["কর পরিশোধ করুন", "Pay the tax"], ["হিসাব করা কর ব্যাংক, কার্ড বা মোবাইল ব্যাংকিংয়ে পরিশোধ করুন।", "Pay the calculated tax by bank, card or mobile banking."]],
          [["জমা দিয়ে স্বীকৃতিপত্র নিন", "Submit and get the acknowledgement"], ["রিটার্ন জমা দিয়ে স্বীকৃতিপত্র ও কপি ডাউনলোড করুন।", "Submit the return and download the acknowledgement and copy."]]
        ],
        faqs: [
          [["কাদের রিটার্ন জমা দিতে হয়?", "Who has to file a return?"], ["করযোগ্য আয় থাকলে, অথবা ট্রেড লাইসেন্স, ক্রেডিট কার্ড বা বড় সঞ্চয়ের মতো সেবা নিতে রিটার্ন জমার প্রমাণ (PSR) লাগলে।", "Anyone with taxable income, or anyone who needs proof of return submission (PSR) for services like a trade license, credit card or large savings."]],
          [["রিটার্ন জমার শেষ তারিখ কবে?", "What is the filing deadline?"], ["সাধারণ করদাতাদের জন্য সাধারণত ৩০ নভেম্বর (কর দিবস); এনবিআর মাঝে মাঝে সময় বাড়ায়।", "For individual taxpayers it is usually 30 November (Tax Day); the NBR sometimes extends it."]]
        ]
      }
    ]
  },
  {
    id: "edu", icon: "cap",
    name: ["শিক্ষা সনদ", "Education Certificate"],
    desc: ["সনদে নাম ও তথ্য সংশোধন", "Correct names and details on certificates"],
    aliases: ["certificate", "sonod", "shonod", "সনদ", "সার্টিফিকেট", "marksheet", "মার্কশিট", "board", "বোর্ড", "ssc", "hsc", "এসএসসি", "এইচএসসি", "education", "শিক্ষা"],
    guides: [
      {
        id: "cert-correction",
        title: ["সনদে নাম ও তথ্য সংশোধন", "Certificate correction"],
        intro: ["যে শিক্ষা বোর্ড থেকে পাস করেছেন সেই বোর্ডের পোর্টালে প্রমাণসহ আবেদন করে সনদের নাম, বানান বা জন্ম তারিখ সংশোধন করা যায়।", "Apply on the portal of the board you passed from, with proof, to correct the name, spelling or date of birth on your certificate."],
        keys: ["correction", "সংশোধন", "songshodhon", "vul", "ভুল", "name", "নাম", "spelling", "বানান"],
        time: ["প্রায় ১–৩ মাস", "About 1–3 months"],
        feeShort: ["বোর্ড ও ধরনভেদে", "Varies by board and type"],
        portal: "https://dhakaeducationboard.gov.bd",
        docs: [
          ["মূল সনদ ও নম্বরপত্র", "Original certificate and marksheet"],
          ["অনলাইন জন্ম নিবন্ধন সনদ", "Online birth registration certificate"],
          ["পিতা ও মাতার এনআইডির কপি", "Copies of both parents' NIDs"],
          ["শিক্ষা প্রতিষ্ঠান প্রধানের প্রত্যয়নপত্র", "Attestation from your institution's head"],
          ["ক্ষেত্রবিশেষে এফিডেভিট ও পত্রিকার বিজ্ঞপ্তি", "Affidavit and newspaper notice in some cases"]
        ],
        fees: { head: [["সংশোধন", "Correction"], ["ফি", "Fee"]], rows: [
          [["নামের বানান সংশোধন", "Name spelling"], ["বোর্ডের সার্কুলার অনুযায়ী", "As per the board circular"]],
          [["নাম বা জন্ম তারিখ পরিবর্তন", "Name or date of birth change"], ["বোর্ডের সার্কুলার অনুযায়ী", "As per the board circular"]]
        ] },
        steps: [
          [["বোর্ডের ওয়েবসাইটে যান", "Visit your board's website"], ["যে বোর্ড থেকে পাস করেছেন তার সংশোধন পোর্টালে যান।", "Open the correction portal of the board you passed from."]],
          [["সংশোধনের আবেদন খুলুন", "Start the correction application"], ["রোল, রেজিস্ট্রেশন নম্বর ও পাসের সাল দিয়ে ফরম খুলুন।", "Open the form with your roll, registration number and passing year."]],
          [["সঠিক তথ্য লিখুন", "Enter the correct details"], ["জন্ম নিবন্ধন অনুযায়ী নামের সঠিক বানান ও তথ্য লিখুন।", "Type the correct name and details exactly as on your birth registration."]],
          [["প্রমাণপত্র যুক্ত করুন", "Attach proof"], ["জন্ম নিবন্ধন, পিতা-মাতার এনআইডি ও পুরনো নম্বরপত্রের স্ক্যান দিন।", "Attach scans of your birth registration, parents' NIDs and old marksheet."]],
          [["ফি দিয়ে প্রিন্ট জমা দিন", "Pay and submit the printout"], ["ফি দিয়ে প্রিন্ট করা আবেদন প্রতিষ্ঠান প্রধানের মাধ্যমে বোর্ডে পাঠান।", "Pay the fee and send the printed application to the board through your institution's head."]]
        ],
        faqs: [
          [["কোন বোর্ডে আবেদন করব?", "Which board should I apply to?"], ["যে বোর্ড থেকে পরীক্ষায় পাস করেছেন, সেই বোর্ডে।", "The board you passed the exam from."]],
          [["এসএসসি সংশোধন করলে কি এইচএসসিও বদলাবে?", "Will correcting SSC also fix my HSC certificate?"], ["না, প্রতিটি সনদের জন্য আলাদা আবেদন করতে হয়।", "No, each certificate needs its own application."]]
        ]
      }
    ]
  }
];

export const POPULAR = [
  ["এনআইডি সংশোধনে কত টাকা লাগে?", "How much does NID correction cost?"],
  ["পাসপোর্ট করতে কী কী কাগজ লাগে?", "What documents do I need for a passport?"],
  ["খাজনা অনলাইনে কীভাবে দেব?", "How do I pay land tax online?"],
  ["e-return er deadline kobe?", "When is the e-Return deadline?"]
];


export function findService(id) {
  return SERVICES.find((s) => s.id === id);
}

export function findGuide(service, id) {
  return service ? service.guides.find((g) => g.id === id) : null;
}
