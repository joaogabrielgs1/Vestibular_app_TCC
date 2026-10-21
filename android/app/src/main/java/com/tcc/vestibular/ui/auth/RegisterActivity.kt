package com.tcc.vestibular.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.tcc.vestibular.data.api.ApiClient
import com.tcc.vestibular.data.api.SessionManager
import com.tcc.vestibular.data.models.RegisterRequest
import com.tcc.vestibular.databinding.ActivityRegisterBinding
import com.tcc.vestibular.ui.main.MainActivity
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)

        binding.btnRegister.setOnClickListener {
            performRegister()
        }

        binding.btnBackToLogin.setOnClickListener {
            finish()
        }
    }

    private fun performRegister() {
        val name = binding.etRegName.text.toString().trim()
        val email = binding.etRegEmail.text.toString().trim()
        val password = binding.etRegPassword.text.toString().trim()

        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Preencha todos os campos.", Toast.LENGTH_SHORT).show()
            return
        }

        if (password.length < 6) {
            Toast.makeText(this, "A senha deve ter no mínimo 6 caracteres.", Toast.LENGTH_SHORT).show()
            return
        }

        binding.regProgressBar.visibility = View.VISIBLE
        binding.btnRegister.isEnabled = false

        lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(this@RegisterActivity)
                val response = apiService.register(RegisterRequest(email, password, name))

                if (response.isSuccessful && response.body() != null) {
                    val authData = response.body()!!
                    sessionManager.saveAuthToken(authData.token)
                    sessionManager.saveUserData(
                        authData.user.id,
                        authData.user.fullName,
                        authData.user.email
                    )
                    Toast.makeText(this@RegisterActivity, "Conta criada com sucesso!", Toast.LENGTH_SHORT).show()
                    
                    val intent = Intent(this@RegisterActivity, MainActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                } else {
                    val serverError = try {
                        val errorJson = response.errorBody()?.string()
                        val jsonObj = org.json.JSONObject(errorJson ?: "")
                        jsonObj.optString("error", "Erro ao cadastrar.")
                    } catch (e: Exception) {
                        "Erro ao cadastrar (${response.code()})."
                    }
                    Toast.makeText(this@RegisterActivity, serverError, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@RegisterActivity,
                    "Erro de conexão: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                binding.regProgressBar.visibility = View.GONE
                binding.btnRegister.isEnabled = true
            }
        }
    }
}
