const errorMiddleware = (err, req, res, next) => {
    console.error("ERROR:", err);
    const statuscode = err.statuscode || 500;
    res.status(statuscode).json({
        message: err.message || 'Server error'
    });
};

module.exports = errorMiddleware;