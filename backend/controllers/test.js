exports.likeSauce = (req, res, next) => {
    const likeObject = JSON.parse(req.body.like);
    const userId = req.auth.userId;
    const sauceId = req.params.id;

    Sauce.findOne({ id: sauceId })
        .then(sauce => {
            if(!sauce) {
                return res.status(404).json({ message: "Cette sauce n'existe pas." });
            }

            const userLikedIndex = sauce.userLiked.indexOf(userId);
            const userDislikedIndex = sauce.userDisliked.indexOf(userId);

            if(likeObject === 1) { // L'user like une sauce
                if(userLikedIndex === -1) { // Il ne l'avait jamais liké
                    sauce.usersLiked.push(userId);
                    sauce.usersDisliked = sauce.usersDisliked.filter(id => id !== userId);
                    const message = userDislikedIndex !== -1 ? "Vous avez changé votre avis et liké cette sauce !" : "Vous avez liké cette sauce !";
                    sauce.save()
                        .then(() => res.status(201).json({ message: message }))
                        .catch(error => res.status(500).json({ error }))
                } else { // Il l'avait déjà liké
                    return res.status(400).json({ message: "Vous avez déjà liké cette sauce !" })
                }

            } else if(likeObject === -1) { // L'user dislike une sauce
                if(userDislikedIndex === -1) { // Il ne l'avait jamais disliké
                    sauce.usersDisliked.push(userId);
                    sauce.usersLiked = sauce.usersLiked.filter(id => id !== userId);
                    const message = userLikedIndex !== -1 ? "Vous avez changé votre avis et disliké cette sauce !" : "Vous avez disliké cette sauce !";
                    sauce.save()
                        .then(() => res.status(201).json({ message: message }))
                        .catch(error => res.status(500).json({ error }))
                } else { // Il l'avait déjà disliké
                    return res.status(400).json({ message: "Vous avez déjà disliké cette sauce !" })
                }

            } else if(likeObject === 0) { // L'user annule son choix
                if(userLikedIndex !== -1) { // Il avait liké
                    sauce.usersLiked.splice(userLikedIndex, 1);
                } else if(userDislikedIndex !== -1) { // Il avait disliké
                    sauce.usersDisliked.splice(userDislikedIndex, 1);
                }
                return sauce.save()
                    .then(() => res.status(201).json({ message: "Vous avez retiré votre avis sur cette sauce !" }))
                    .catch(error => res.status(500).json({ error }));

            } else {
                return res.status(400),json({ message: "Valeur de like non valide" });
            }
        })
        .catch(error => res.status(500).json({ error }));
}