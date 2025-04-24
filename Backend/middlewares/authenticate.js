
const authenticate = (req, res, next) => {
  if (req.session && req.session.user) {
    req.body.userId = req.session.user.userID;
    req.user = req.session.user;
    next();
  } else {
    res.status(401).send({ message: "Unauthorized access. Please login first!" });
  }
};

module.exports = { authenticate };