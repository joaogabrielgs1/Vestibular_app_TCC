package com.tcc.vestibular.data.models

import com.google.gson.annotations.SerializedName

data class SubmitAnswerRequest(
    @SerializedName("question_id") val questionId: Int,
    @SerializedName("alternative_id") val alternativeId: Int
)

data class AnswerResponse(
    val message: String,
    @SerializedName("answer_id") val answerId: Long,
    @SerializedName("is_correct") val isCorrect: Boolean,
    @SerializedName("correct_alternative_id") val correctAlternativeId: Int?,
    @SerializedName("correct_letter") val correctLetter: String?,
    val explanation: String?
)

data class HistoryItem(
    @SerializedName("answer_id") val answerId: Long,
    @SerializedName("is_correct") val isCorrect: Boolean,
    @SerializedName("answered_at") val answeredAt: String,
    @SerializedName("question_id") val questionId: Int,
    val statement: String,
    val year: Int,
    @SerializedName("subject_name") val subjectName: String,
    @SerializedName("vestibular_acronym") val vestibularAcronym: String,
    @SerializedName("chosen_letter") val chosenLetter: String?,
    @SerializedName("chosen_text") val chosenText: String?,
    @SerializedName("correct_letter") val correctLetter: String?,
    @SerializedName("correct_text") val correctText: String?,
    val explanation: String?
)

data class HistoryResponse(
    val total: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int,
    val data: List<HistoryItem>
)

data class OverviewStats(
    @SerializedName("total_answered") val totalAnswered: Int,
    @SerializedName("total_correct") val totalCorrect: Int,
    @SerializedName("total_wrong") val totalWrong: Int,
    @SerializedName("accuracy_percentage") val accuracyPercentage: Double
)

data class SubjectStats(
    @SerializedName("subject_id") val subjectId: Int,
    @SerializedName("subject_name") val subjectName: String,
    @SerializedName("total_answered") val totalAnswered: Int,
    @SerializedName("total_correct") val totalCorrect: Int,
    @SerializedName("total_wrong") val totalWrong: Int,
    @SerializedName("accuracy_percentage") val accuracyPercentage: Double
)

data class StatisticsResponse(
    val overview: OverviewStats,
    @SerializedName("by_subject") val bySubject: List<SubjectStats>
)
