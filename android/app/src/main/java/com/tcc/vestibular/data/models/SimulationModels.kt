package com.tcc.vestibular.data.models

import com.google.gson.annotations.SerializedName
import java.io.Serializable

data class CreateSimulationRequest(
    val title: String? = null,
    @SerializedName("subject_id") val subjectId: Int? = null,
    @SerializedName("vestibular_id") val vestibularId: Int? = null,
    val year: Int? = null,
    val limit: Int = 10
)

data class CreateSimulationResponse(
    val message: String,
    val simulation: CreatedSimulationInfo
)

data class CreatedSimulationInfo(
    val id: Int,
    val title: String,
    @SerializedName("totalQuestions") val totalQuestions: Int
)

data class ActiveSimulationResponse(
    val active: Boolean,
    val simulation: ActiveSimulationData?
)

data class ActiveSimulationData(
    val id: Int,
    val title: String,
    @SerializedName("subject_id") val subjectId: Int?,
    @SerializedName("vestibular_id") val vestibularId: Int?,
    val year: Int?,
    @SerializedName("total_questions") val totalQuestions: Int,
    @SerializedName("current_question_index") val currentQuestionIndex: Int,
    val status: String,
    @SerializedName("started_at") val startedAt: String,
    @SerializedName("subject_name") val subjectName: String?,
    @SerializedName("vestibular_acronym") val vestibularAcronym: String?,
    val questions: List<SimulationQuestionItem>
) : Serializable

data class SimulationQuestionItem(
    @SerializedName("order_index") val orderIndex: Int,
    @SerializedName("selected_alternative_id") var selectedAlternativeId: Int?,
    @SerializedName("question_id") val questionId: Int,
    val year: Int,
    val statement: String,
    @SerializedName("image_url") val imageUrl: String?,
    val difficulty: String?,
    @SerializedName("subject_name") val subjectName: String,
    @SerializedName("vestibular_acronym") val vestibularAcronym: String,
    val alternatives: List<Alternative>
) : Serializable

data class SaveSimulationAnswerRequest(
    @SerializedName("question_id") val questionId: Int,
    @SerializedName("alternative_id") val alternativeId: Int,
    @SerializedName("current_question_index") val currentQuestionIndex: Int
)

data class FinishSimulationResponse(
    val message: String,
    val result: SimulationResultData
)

data class SimulationResultData(
    val id: Int,
    val title: String,
    @SerializedName("total_questions") val totalQuestions: Int,
    @SerializedName("total_correct") val totalCorrect: Int,
    @SerializedName("total_wrong") val totalWrong: Int,
    @SerializedName("accuracy_percentage") val accuracyPercentage: Double,
    @SerializedName("started_at") val startedAt: String,
    @SerializedName("finished_at") val finishedAt: String?,
    @SerializedName("subject_name") val subjectName: String?,
    @SerializedName("vestibular_acronym") val vestibularAcronym: String?,
    val questions: List<SimulationReviewQuestion>
) : Serializable

data class SimulationReviewQuestion(
    @SerializedName("order_index") val orderIndex: Int,
    @SerializedName("is_correct") val isCorrect: Boolean?,
    @SerializedName("question_id") val questionId: Int,
    val year: Int,
    val statement: String,
    @SerializedName("image_url") val imageUrl: String?,
    val explanation: String?,
    @SerializedName("subject_name") val subjectName: String,
    @SerializedName("vestibular_acronym") val vestibularAcronym: String,
    @SerializedName("chosen_letter") val chosenLetter: String?,
    @SerializedName("chosen_text") val chosenText: String?,
    @SerializedName("correct_letter") val correctLetter: String?,
    @SerializedName("correct_text") val correctText: String?
) : Serializable
