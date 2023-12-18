const mongoose = require('mongoose');
const {
    Schema
} = mongoose;

var db = {};

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});



const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    zip: {
        type: String,
        default: ""
    },
    line1: {
        type: String,
        default: ""
    },
    line2: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    locale: {
        type: String,
        default: "en"
    },
    activeSince: Date,
    verified: {
        type: Boolean,
        default: false
    },
    visible: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        default: ""
    },
    availability: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    floatingBalance: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: "eur"
    },
    rating: {
        type: Number,
        default: -1
    },
    password: {
        type: String,
        required: true
    },
    languages: {
        type: Map,
        of: Number
    },
    subjects: {
        type: Map,
        of: new Schema({
            level: Number,
            tf: {
                type: Map,
                of: Number
            }
        })
    },
    timetable: {
        type: Map,
        of: {
            type: [new Schema({
                start: String,
                end: String
            })],
            default: undefined
        }
    },
    activeSince: Date,
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailCode: String,
    resetCode: String,
    resetExpiry: Date,
    role: {
        type: Number,
        default: 0
    },
    isSpecialOffer: {
        type: Boolean,
        default: true
    },
    specialOfferLeft: {
        type: Number,
        default: 1
    },
    specialOfferTutor: {
        type: String,
        default: ""
    },
    video: {
        type: Boolean,
        default: false
    },
    video_id: String,
    video_source: String,
    socialStudent: {
        type: Boolean,
        default: false
    },
    socialTeacher: {
        type: Boolean,
        default: false
    },
    professionalTeacher: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


const lessonSchema = new Schema({
    duration: {
        type: Number,
        required: true
    },
    starttime: {
        type: Date,
        required: true
    },
    endtime: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    sid: {
        type: String,
        required: true
    },
    tid: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    history: [
        new Schema({
            date: {
                type: Date
            },
            type: {
                type: String
            }
        })
    ]
}, { timestamps: true });


const transactionSchema = new Schema({
    rxid: {
        type: String,
        required: true
    },
    txid: {
        type: String,
        required: true
    },
    lessonid: {
        type: String
    },
    status: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    fee: {
        type: Number
    },
    amount: {
        type: Number
    },
    history: [
        new Schema({
            date: {
                type: Date
            },
            type: {
                type: String
            }
        })
    ],
    donation: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const reviewSchema = new Schema({
    tid: {
        type: String,
        required: true
    },
    sid: {
        type: String,
        required: true
    },
    lid: {
        type: String,
        required: true
    },
    subject: {
        type: String
    },
    text: {
        type: String
    },
    rating: {
        type: Number,
        required: true
    },
    duration: {
        type: Number
    }
}, { timestamps: true });

const notificationSchema = new Schema({
    rxid: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    link: {
        type: String
    },
    name: {
        type: String
    },
    read: {
        type: Boolean,
        default: false
    },
    price: Number
}, { timestamps: true });

const blogpostSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    thumbnail: String,
    small_image: String,
    headline: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    meta: {
        type: Object,
        of: {
            type: [new Schema({
                title: String,
                description: String,
                keywords: String,
                image: String
            })],
            default: undefined
        }
    },
    readtime: Number,
    featured: Boolean,
    language: String,
    helpful_yes: Number,
    helpful_no: Number,
    public: Boolean,
    cta: {
        type: Object,
        of: {
            type: [new Schema({
                active: Boolean,
                headline: String,
                subheadline: String,
                btn: String,
                link: String
            })]
        }
    },
    knowledgebase: Boolean
}, { timestamps: true });

const messageSchema = new Schema({
    rx: {
        type: String,
        required: true
    },
    tx: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const olympiadStudents = new Schema({
    phone: {
        type: String,
        required: true
    },
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    subject: {
        type: String
    },
    class: {
        type: String
    },
    interestedInTutoring: {
        type: String
    }
}, { timestamps: true });

var analytics_eventsSchema = new Schema({}, { timestamps: true, strict: false });


db.User = mongoose.model('User', userSchema);
db.Lesson = mongoose.model('Lesson', lessonSchema);
db.Transaction = mongoose.model('Transaction', transactionSchema);
db.Review = mongoose.model('Review', reviewSchema);
db.Notification = mongoose.model('Notification', notificationSchema);
db.Blog = mongoose.model('Blogpost', blogpostSchema);
db.analytics_events = mongoose.model('analytics_event', analytics_eventsSchema);
db.Message = mongoose.model('message', messageSchema);
db.OlympiadStudents = mongoose.model('olympiad_students', olympiadStudents);

exports.escapeMongo = (str) => {
    return str.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, "\\$&");
}

module.exports = db;