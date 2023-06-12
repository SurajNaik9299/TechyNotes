const User = require("../models/User");
const Note = require("../models/Note");
const bcrypt = require("bcrypt");

// @desc Get All Users
// @route GET /users
// @access Private
const getAllUsers = async (req, res) => {
  // -password  = Dont return password data
  const users = await User.find().select("-password").lean();
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }
  res.json(users);
};

// @desc Create New Users
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
  const { username, password, roles } = req.body;

  // Confirm Data
  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  //Check for duplicates
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate User Name" });
  }

  //Hash Password
  const hashedPwd = await bcrypt.hash(password, 10); //salt rounds

  const userObject =
    !Array.isArray(roles) || !roles.length
      ? { username, password: hashedPwd }
      : { username, password: hashedPwd, roles };

  //Create and store new user
  const user = await User.create(userObject);

  if (user) {
    res.status(201).json({ message: `New User ${username} created.` });
  } else {
    res.status(400).json({ message: "Inval_id User data received." });
  }
};



const updateUser = async (req, res) => {
  const { id, username, roles, active, password } = req.body;

  // Confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res
      .status(400)
      .json({ message: "All fields except password are required" });
  }

  // Does the user exist to update?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    // Hash password
    user.password = await bcrypt.hash(password, 10); // salt rounds
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated` });
};

// @desc Delete a  User
// @route DELETE /users
// @access Private
const deleteUser = async (req, res) => {
  const { _id } = req.body;
  if (!_id) {
    return res.status(400).json({ message: "User _id required" });
  }

  const notes = await Note.findOne({ user: _id }).lean().exec();
  //Optional parameter
  if (notes) {
    return res.status(400).json({ message: "User has assigned notes" });
  }

  const user = await User.findById(_id).exec();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const result = await user.deleteOne();

  const reply = `Username ${result.username} with _id ${result._id} deleted`;
  res.json(reply);
};

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
