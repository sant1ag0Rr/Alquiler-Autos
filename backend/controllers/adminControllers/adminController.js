export const adminAuth = (req, res, next) => {
  try {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      return res.status(403).json({ message: "Only access for admins" });
    }
  } catch (error) {
    next(error);
  }
};

export const adminProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "Admin profile data",
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};
