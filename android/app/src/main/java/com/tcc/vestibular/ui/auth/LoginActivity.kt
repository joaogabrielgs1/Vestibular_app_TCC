package com.tcc.vestibular.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.tcc.vestibular.data.api.ApiClient
import com.tcc.vestibular.data.api.SessionManager
import com.tcc.vestibular.data.models.LoginRequest
import com.tcc.vestibular.databinding.ActivityLoginBinding
import com.tcc.vestibular.ui.main.MainActivity
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)

        // Se o usuário já estiver logado, redireciona para a tela principal (Hub Home)
        if (sessionManager.isLoggedIn()) {
            goToMainActivity()
            return
        }

        binding.btnLogin.setOnClickListener {
            performLogin()
        }

        binding.btnGoToRegister.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
        }
    }

    private fun performLogin() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Preencha o e-mail e a senha.", Toast.LENGTH_SHORT).show()
            return
        }

        binding.progressBar.visibility = View.VISIBLE
        binding.btnLogin.isEnabled = false

        lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(this@LoginActivity)
                val response = apiService.login(LoginRequest(email, password))

                if (response.isSuccessful && response.body() != null) {
                    val authData = response.body()!!
                    sessionManager.saveAuthToken(authData.token)
                    sessionManager.saveUserData(
                        authData.user.id,
                        authData.user.fullName,
                        authData.user.email
                    )
                    Toast.makeText(this@LoginActivity, "Bem-vindo!", Toast.LENGTH_SHORT).show()
                    goToMainActivity()
                } else {
                    val serverError = try {
                        val errorJson = response.errorBody()?.string()
                        val jsonObj = org.json.JSONObject(errorJson ?: "")
                        jsonObj.optString("error", "Credenciais inválidas.")
                    } catch (e: Exception) {
                        "Erro ao autenticar (${response.code()})."
                    }
                    Toast.makeText(this@LoginActivity, serverError, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@LoginActivity,
                    "Falha ao conectar com o servidor: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.btnLogin.isEnabled = true
            }
        }
    }

    private fun goToMainActivity() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
