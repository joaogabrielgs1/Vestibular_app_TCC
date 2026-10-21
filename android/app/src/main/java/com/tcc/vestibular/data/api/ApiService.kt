package com.tcc.vestibular.data.api

import com.tcc.vestibular.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Autenticação
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @GET("auth/profile")
    suspend fun getProfile(): Response<UserProfile>

    @PUT("auth/email")
    suspend fun updateEmail(@Body request: UpdateEmailRequest): Response<AuthResponse>

    @PUT("auth/password")
    suspend fun updatePassword(@Body request: UpdatePasswordRequest): Response<GenericMessageResponse>

    @HTTP(method = "DELETE", path = "auth/account", hasBody = true)
    suspend fun deleteAccount(@Body request: DeleteAccountRequest): Response<GenericMessageResponse>

    // Filtros
    @GET("filters/subjects")
    suspend fun getSubjects(): Response<List<Subject>>

    @GET("filters/vestibulares")
    suspend fun getVestibulares(): Response<List<Vestibular>>

    @GET("filters/years")
    suspend fun getYears(): Response<List<Int>>

    // Questões
    @GET("questions")
    suspend fun getQuestions(
        @Query("subject_id") subjectId: Int? = null,
        @Query("year") year: Int? = null,
        @Query("vestibular_id") vestibularId: Int? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10
    ): Response<QuestionsResponse>

    @GET("questions/{id}")
    suspend fun getQuestionById(@Path("id") id: Int): Response<Question>

    // Respostas, Histórico e Estatísticas
    @POST("answers")
    suspend fun submitAnswer(@Body request: SubmitAnswerRequest): Response<AnswerResponse>

    @GET("answers/history")
    suspend fun getHistory(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<HistoryResponse>

    @GET("answers/statistics")
    suspend fun getStatistics(): Response<StatisticsResponse>

    @GET("answers/subject/{subjectId}")
    suspend fun getSubjectQuestions(
        @Path("subjectId") subjectId: Int,
        @Query("status") status: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<HistoryResponse>

    // Simulados
    @POST("simulations")
    suspend fun createSimulation(@Body request: CreateSimulationRequest): Response<CreateSimulationResponse>

    @GET("simulations/active")
    suspend fun getActiveSimulation(): Response<ActiveSimulationResponse>

    @POST("simulations/{id}/answer")
    suspend fun saveSimulationAnswer(
        @Path("id") id: Int,
        @Body request: SaveSimulationAnswerRequest
    ): Response<Any>

    @POST("simulations/{id}/finish")
    suspend fun finishSimulation(@Path("id") id: Int): Response<FinishSimulationResponse>

    @GET("simulations/{id}/result")
    suspend fun getSimulationResult(@Path("id") id: Int): Response<SimulationResultData>

    @GET("simulations/history")
    suspend fun getSimulationHistory(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<Any>
}
