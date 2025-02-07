const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2')
const weightSchema = new mongoose.Schema({

    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        required: true, 
        ref: 'User' 
    },

    weight: {
        type: Number,
        required: [true,'PLease enter your weight']
    },
    date: {
        type: Date,
        default: Date.now,

    }
});
weightSchema.plugin(mongoosePaginate);
const Weight =mongoose.model('Weight', weightSchema);
module.exports = Weight;