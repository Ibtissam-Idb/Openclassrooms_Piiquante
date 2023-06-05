const Sauce = require("../models/Sauce");
const fs = require("fs");

exports.createSauce = (req, res, next) => {
    const sauceObject = req.body.sauce;
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });

    sauce.save()
        .then(() => res.status(201).json({ message: "La sauce a été créée avec succès !" }))
        .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    } : { ...req.body };

    delete sauceObject.userId;
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: "Non-autorisé" });
            } else {
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: "La sauce a été modifiée avec succès !" }))
                    .catch(error => res.status(500).json({ error }));
            }
        })
        .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: "Non-autorisé" });
            } else {
                const filename = sauce.imageUrl.split("/images/")[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json({ message: "La sauce a été supprimée avec succès !" }))
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => res.status(500).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json({ sauces }))
        .catch(error => res.status(500).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json({ sauce }))
        .catch(error => res.status(404).json({ error }));
};

exports.likeSauce = (req, res, next) => {
    const likeObject = req.body.like;
    const userId = req.auth.userId;
    const sauceId = req.params.id;

    Sauce.findOne({ _id: sauceId })
        .then(sauce => {
            if (!sauce) {
                return res.status(404).json({ message: "Cette sauce n'existe pas." });
            }

            const userLikedIndex = sauce.userLiked.indexOf(userId);
            const userDislikedIndex = sauce.userDisliked.indexOf(userId);

            if (likeObject === 1) { // L'user like une sauce
                if (userLikedIndex === -1) { // Il ne l'avait jamais liké
                    sauce.usersLiked.push(userId);
                    sauce.usersDisliked = sauce.usersDisliked.filter(id => id !== userId);
                    const message = userDislikedIndex !== -1 ? "Vous avez changé votre avis et liké cette sauce !" : "Vous avez liké cette sauce !";
                    sauce.save()
                        .then(() => res.status(201).json({ message: message }))
                        .catch(error => res.status(500).json({ error }))
                } else { // Il l'avait déjà liké
                    return res.status(400).json({ message: "Vous avez déjà liké cette sauce !" })
                }

            } else if (likeObject === -1) { // L'user dislike une sauce
                if (userDislikedIndex === -1) { // Il ne l'avait jamais disliké
                    sauce.usersDisliked.push(userId);
                    sauce.usersLiked = sauce.usersLiked.filter(id => id !== userId);
                    const message = userLikedIndex !== -1 ? "Vous avez changé votre avis et disliké cette sauce !" : "Vous avez disliké cette sauce !";
                    sauce.save()
                        .then(() => res.status(201).json({ message: message }))
                        .catch(error => res.status(500).json({ error }))
                } else { // Il l'avait déjà disliké
                    return res.status(400).json({ message: "Vous avez déjà disliké cette sauce !" })
                }

            } else if (likeObject === 0) { // L'user annule son choix
                if (userLikedIndex !== -1) { // Il avait liké
                    sauce.usersLiked.splice(userLikedIndex, 1);
                } else if (userDislikedIndex !== -1) { // Il avait disliké
                    sauce.usersDisliked.splice(userDislikedIndex, 1);
                }
                return sauce.save()
                    .then(() => res.status(201).json({ message: "Vous avez retiré votre avis sur cette sauce !" }))
                    .catch(error => res.status(500).json({ error }));

            } else {
                return res.status(400), json({ message: "Valeur de like non valide" });
            }
        })
        .catch(error => res.status(500).json({ error }))
}