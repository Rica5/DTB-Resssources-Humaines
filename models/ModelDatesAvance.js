const mongoose = require('mongoose');

const AvanceDateSchema = mongoose.Schema({
    start_date: {
        type: Date,
        required: true, // Rend ce champ obligatoire
        default: Date.now
    },
    end_date: {
        type: Date,
        required: true, // Rend ce champ obligatoire
        default: Date.now,
        validate: {
            validator: function (value) {
                // Valide que la date de fin est après la date de début
                return this.start_date <= value;
            },
            message: 'La date de fin doit être après la date de début.'
        }
    },
    working_days: {
        type: [Number], // Jours ouvrables représentés par des chiffres (0 = Dimanche, 1 = Lundi, etc.)
        default: [1, 2, 3, 4, 5] // Lundi à Vendredi par défaut
    },
    holidays: {
        type: [Date], // Liste des jours fériés
        default: []
    },
    month: {
        type: String, // Format: YYYY-MM
        required: true,
        unique: true // Ensures there are no duplicate entries for the same month
    }
}, {
    timestamps: true,
});

// Pour s'assurer qu'il n'y a pas de chevauchement entre les plages de dates définies
AvanceDateSchema.index({ start_date: 1, end_date: 1 }, { unique: true });

module.exports = mongoose.model('AvanceDate', AvanceDateSchema);
