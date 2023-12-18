function __ba_metadata() {
    var mobile = false;
    try {
        mobile = navigator.userAgentData.mobile;
    } catch (error) {}

    var data = { date: Date.now(), location: "" };

    try {
        data = {
            date: Date.now(),
            device: {
                useragent: navigator.userAgent,
                mobile: mobile,
                language_browser: navigator.language,
            },
            user: {
                uid: typeof(uData) != "undefined" ? uData._id : "",
                locale: i18n_locale,
                currency: i18n_currency,
            },
            network: {
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                effectiveType: navigator.connection.effectiveType,
            },
            screen: {
                resolution: [screen.width, screen.height],
                workspace: [$(window).width(), $(window).height()],
                orientation: screen.orientation.type,
            },
            location: ""
        }
    } catch (error) {}

    return data;
}

async function __analytics_tp_view() {
    r('analytics/teacher/view', { action: "tp_view", meta: __ba_metadata() });
}

async function __analytics_tv_nr(filter) {
    r('analytics/teachers/noresult', { action: "tv_nr", filter: filter, meta: __ba_metadata() });
}

async function __analytics_track(action, data, meta = true) {
    var m = __ba_metadata();
    if (meta == false) { m = {}; }
    r('analytics/track', { action: action, data: data, meta: m });
}