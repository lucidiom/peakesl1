const { stripHtml } = require("string-strip-html");

module.exports = {
    cleanString: function(str) {
        if (str == undefined) {
            return "";
        }

        return stripHtml(str).result;
    },
    availableSubjects: {
        "German": "German",
        "English": "English",
        "Italian": "Italian",
        "Spanish": "Spanish",
        "Russian": "Russian",
        "French": "French",
        "Dutch": "Dutch",
        "Maths": "Maths",
        "Latin": "Latin",
        "Greek": "Greek",
        "Webdev": "Web development",
        "Softdev": "Software development",
        "Accounting": "Accounting",
        "Finances": "Finances",
        "Consulting": "Consulting",
        "Coaching": "Coaching",
        "Writing-and-translations": "Writing & Translations",
        "Sales-and-marketing": "Sales & Marketing",
        "Graphics-and-design": "Graphics & Design",
        "Digital-marketing": "Digital Marketing",
        "Education-and-training": "Education & Training",
        "Chemistry": "Chemistry",
        "Geography": "Geography",
        "Physics": "Physics",
        "Biology": "Biology",
        "Economics": "Economics",
        "Music": "Music",
        "Arts": "Arts",
        "Politics": "Politics",
        "History": "History",
        "Religion": "Religion",
        "Computer-science": "Computer Science",
        "Philosophy": "Philosophy",
        "Technical-drawing": "Technical Drawing",
        "Theater": "Theater",
        "Astrophysics": "Astrophysics"
    },
    numberToWeekday: {
        0: "sunday",
        1: "monday",
        2: "tuesday",
        3: "wednesday",
        4: "thursday",
        5: "friday",
        6: "saturday"
    },
    weekdayToNumber: {
        "sunday": 0,
        "monday": 1,
        "tuesday": 2,
        "wednesday": 3,
        "thursday": 4,
        "friday": 5,
        "saturday": 6
    },
    replaceAll: function(str, search, replace) {
        var search_escaped = search.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
        return str.replace(new RegExp(search_escaped, 'g'), replace);
    },
    fillupHour: function(timeItem) {
        if (timeItem.split(":")[0] != "23" && timeItem.split(":")[1] == 59) {
            var hour = parseInt(timeItem.split(":")[0]);
            hour++;
            timeItem = ("00" + hour).slice(-2) + ":00";
        }
        return timeItem;
    },
    capitalize: function(s) {
        return s[0].toUpperCase() + s.slice(1);
    }
};