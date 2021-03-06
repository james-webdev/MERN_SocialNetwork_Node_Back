const Post = require("../models/post");
const formidable = require("formidable");
const fs = require("fs");

exports.isPoster = (req, res, next) => {
  console.log("req.auth :", req.auth);
  console.log("req.post :", req.post);
  console.log("req.post.postedBy._id :", req.post.postedBy._id);
  let sameUser = req.post && req.auth && req.post.postedBy._id == req.auth._id;
  let adminUser = req.post && req.auth && req.auth.role === "admin";
  let isPoster = sameUser || adminUser;

  console.log("SAMEUSER", sameUser, "ADMINUSER", adminUser);

  console.log(isPoster);
  if (!isPoster) {
    res.json({ message: "you are not authorised to carry out this action" });
  }
  next();
};

exports.postShow = (req, res) => {
  console.log(req.post);
  return res.json(req.post);
};

exports.postsIndex = (req, res) => {
  const posts = Post.find()
    .populate("postedBy", "_id name")
    .select("_id title body created likes")
    .sort({ created: -1 })
    .then((posts) => {
      res.json({ posts });
    })
    .catch((err) => console.log(err));
};

exports.createPost = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not be uploaded",
      });
    }
    let post = new Post(fields);
    req.profile.password = undefined;
    post.postedBy = req.profile;

    if (files.photo) {
      post.photo.data = fs.readFileSync(files.photo.path);
      post.photo.contentType = files.photo.type;
    }
    post.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }
      console.log(result);
      res.json(result);
    });
  });
};

exports.postById = (req, res, next, id) => {
  Post.findById(id)
    .populate("postedBy", "_id name role")
    .exec((err, post) => {
      console.log(post);
      if (err || !post) {
        return res.status(400).json({
          error: "User not found",
        });
      }
      req.post = post;
      next();
    });
};

exports.deletePost = (req, res) => {
  let post = req.post;
  post.remove((err, post) => {
    if (err) {
      console.log(err);
      return res.status(400).json({
        error: "Cannot delete",
      });
    }
    res.json({ message: "post succesfully deleted" });
  });
};

exports.photo = (req, res, next) => {
  res.set("Content-Type", req.post.photo.contentType);
  return res.send(req.post.photo.data);
};

exports.postsByUserId = (req, res) => {
  Post.find({ postedBy: req.profile._id })
    .populate("postedBy", "_id name")
    .select("_id title body created likes")
    .sort("_created")
    .exec((err, posts) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }
      res.json(posts);
    });
};

// exports.postsByUserIdCount = (req, res, next) => {
//   Post.find({ postedBy: req.profile._id }).countDocuments((err, count) => {
//     if (err) {
//       return res.status(400).json({
//         error: err,
//       });
//     }
//     console.log("here is your count", count);
//     res.json(count);
//   });
//   next();
// };

exports.like = (req, res) => {
  Post.findByIdAndUpdate(
    req.body.postId,
    { $push: { likes: req.body.userId } },
    { new: true }
  ).exec((err, result) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    res.json(result);
  });
};

exports.unlike = (req, res) => {
  Post.findByIdAndUpdate(
    req.body.postId,
    { $pull: { likes: req.body.userId } },
    { new: true }
  ).exec((err, result) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    res.json(result);
  });
};

// exports.deletePostsByUserId = (req, res) => {
//   Post.findByIdAndRemove({ postedBy: req.profile._id }).exec((err, posts) => {
//     if (err) {
//       return res.status(400).json({
//         error: err,
//       });
//     }
//     res.json({ message: "post succesfully deleted" });
//   });
// };
// exports.deletePostsByUserId = (req, res, next) => {
//   Post.findByIdAndRemove(req.profile._id, function (err, posts) {
//     if (err) {
//       return res.status(400).json({
//         error: err,
//       });
//     } else {
//       console.log("Removed posts : ", posts);
//       res.json({ message: "posts succesfully deleted" });
//     }
//   });
//   next();
// // };

exports.deletePostsByUserId = (req, res) => {
  Post.find({ postedBy: req.profile._id }).deleteMany((err, posts) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    res.json(posts);
  });
};
