package com.tcc.vestibular.data.models

import com.google.gson.annotations.SerializedName
import java.io.Serializable

data class Alternative(
    val id: Int,
    @SerializedName("question_id") val questionId: Int,
    val letter: String,
    val text: String
) : Serializable

data class Question(
    val id: Int,
    val year: Int,
    val statement: String,
    @SerializedName("image_url") val imageUrl: String?,
    val explanation: String?,
    val difficulty: String?,
    @SerializedName("subject_id") val subjectId: Int,
    @SerializedName("subject_name") val subjectName: String,
    @SerializedName("vestibular_id") val vestibularId: Int,
    @SerializedName("vestibular_acronym") val vestibularAcronym: String,
    @SerializedName("vestibular_name") val vestibularName: String,
    val alternatives: List<Alternative>
) : Serializable

data class QuestionsResponse(
    val total: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int,
    val data: List<Question>
)
