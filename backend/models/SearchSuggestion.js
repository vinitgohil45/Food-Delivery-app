import mongoose from 'mongoose';

const searchSuggestionSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    popularity: {
      type: Number,
      default: 1,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const SearchSuggestion = mongoose.model('SearchSuggestion', searchSuggestionSchema);

export default SearchSuggestion;
