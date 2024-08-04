import mongoose ,{Schema , Document} from 'mongoose'


const CategorySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please enter category name'],
        trim: true,
        maxLength: [50, 'Category name cannot exceed 50 characters']
    },
    image: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})



const Category = mongoose.model('Category', CategorySchema)

export default Category