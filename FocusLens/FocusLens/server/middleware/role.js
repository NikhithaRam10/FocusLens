const isInstructor = (req, res, next) => {

    if (req.user.role !== "instructor") {

        return res.status(403).json({
            success: false,
            message: "Instructor Access Only",
        });

    }

    next();

};

const isStudent = (req, res, next) => {

    if (req.user.role !== "student") {

        return res.status(403).json({
            success: false,
            message: "Student Access Only",
        });

    }

    next();

};

module.exports = {
    isInstructor,
    isStudent,
};