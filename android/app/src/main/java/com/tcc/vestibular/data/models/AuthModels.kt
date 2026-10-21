package com.tcc.vestibular.data.models

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    @SerializedName("full_name") val fullName: String
)

data class AuthUser(
    val id: Int,
    val email: String,
    @SerializedName("full_name") val fullName: String,
    val bio: String?,
    @SerializedName("avatar_url") val avatarUrl: String?
)

data class AuthResponse(
    val message: String,
    val token: String,
    val user: AuthUser
)

data class UserProfile(
    val id: Int,
    val email: String,
    @SerializedName("full_name") val fullName: String,
    val bio: String?,
    @SerializedName("avatar_url") val avatarUrl: String?,
    @SerializedName("created_at") val createdAt: String
)

data class UpdateEmailRequest(
    @SerializedName("current_password") val currentPassword: String,
    @SerializedName("new_email") val newEmail: String
)

data class UpdatePasswordRequest(
    @SerializedName("current_password") val currentPassword: String,
    @SerializedName("new_password") val newPassword: String,
    @SerializedName("confirm_password") val confirmPassword: String
)

data class DeleteAccountRequest(
    val password: String
)

data class GenericMessageResponse(
    val message: String
)
