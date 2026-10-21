package com.tcc.vestibular.data.models

data class Subject(
    val id: Int,
    val name: String,
    val description: String?
)

data class Vestibular(
    val id: Int,
    val name: String,
    val acronym: String
)
