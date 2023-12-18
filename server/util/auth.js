exports.isAuthNav = (req, res, next) => {
    if (req.isAuthenticated()) {
        req.setLocale(req.user.locale);
        return next();
    }
    res.status(401);
    res.redirect('/login/?required&redirect=' + encodeURI(req.originalUrl));
};

exports.isAdminAuthNav = (req, res, next) => {
    if (!req.isAuthenticated()) {
    res.status(401);
        res.redirect('/login/?required&redirect=' + encodeURI(req.originalUrl));
        return;
    }

    if (req.user.role < 60) {
        res.redirect('/tutors/');
    }

    req.setLocale(req.user.locale);
    return next();
};

exports.isAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).send("unauthorized");
};

exports.isAdminAuth = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role == 100) return next();
    res.status(401).send("unauthorized");
};

exports.loggedInRedirect = (req, res, next) => {
    if (!req.isAuthenticated()) return next();
    res.redirect('/tutors/');
}