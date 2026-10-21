package com.tcc.vestibular.ui.home

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.tcc.vestibular.data.api.ApiClient
import com.tcc.vestibular.data.api.SessionManager
import com.tcc.vestibular.data.models.ActiveSimulationData
import com.tcc.vestibular.databinding.ActivityHomeBinding
import com.tcc.vestibular.ui.auth.LoginActivity
import com.tcc.vestibular.ui.main.MainActivity
import com.tcc.vestibular.ui.simulation.CreateSimulationActivity
import com.tcc.vestibular.ui.simulation.SimulationExamActivity
import kotlinx.coroutines.launch

class HomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHomeBinding
    private lateinit var sessionManager: SessionManager
    private var activeSimulation: ActiveSimulationData? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)

        val userName = sessionManager.getUserName()
        if (userName.isNotEmpty()) {
            binding.tvWelcomeGreeting.text = "Olá, ${userName.split(" ").first()}!"
        }

        setupClickListeners()
    }

    override fun onResume() {
        super.onResume()
        checkActiveSimulation()
    }

    private fun setupClickListeners() {
        // Resolver Questões avulsas -> Abre MainActivity na aba de Questões
        binding.cardSolveQuestions.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java).apply {
                putExtra("TARGET_TAB", "QUESTIONS")
            }
            startActivity(intent)
        }

        // Novo Simulado -> Abre CreateSimulationActivity
        binding.cardNewSimulation.setOnClickListener {
            val intent = Intent(this, CreateSimulationActivity::class.java)
            startActivity(intent)
        }

        // Continuar Simulado ativo
        binding.btnResumeSimulation.setOnClickListener {
            activeSimulation?.let { sim ->
                val intent = Intent(this, SimulationExamActivity::class.java).apply {
                    putExtra("EXTRA_SIMULATION_DATA", sim)
                }
                startActivity(intent)
            }
        }

        // Meu Perfil e Estatísticas -> Abre MainActivity na aba de Perfil
        binding.cardProfileStats.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java).apply {
                putExtra("TARGET_TAB", "PROFILE")
            }
            startActivity(intent)
        }

        // Histórico -> Abre MainActivity na aba de Histórico
        binding.cardHistory.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java).apply {
                putExtra("TARGET_TAB", "HISTORY")
            }
            startActivity(intent)
        }

        // Logout
        binding.btnLogoutHome.setOnClickListener {
            sessionManager.clearSession()
            val intent = Intent(this, LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            startActivity(intent)
            finish()
        }
    }

    private fun checkActiveSimulation() {
        lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(this@HomeActivity)
                val response = apiService.getActiveSimulation()

                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    if (body.active && body.simulation != null) {
                        activeSimulation = body.simulation
                        showResumeCard(body.simulation)
                    } else {
                        binding.cardResumeSimulation.visibility = View.GONE
                        activeSimulation = null
                    }
                } else {
                    binding.cardResumeSimulation.visibility = View.GONE
                }
            } catch (e: Exception) {
                binding.cardResumeSimulation.visibility = View.GONE
            }
        }
    }

    private fun showResumeCard(sim: ActiveSimulationData) {
        val currentQuestionNumber = sim.currentQuestionIndex + 1
        binding.tvResumeProgress.text = "Questão $currentQuestionNumber de ${sim.totalQuestions}"
        binding.tvResumeTitle.text = sim.title
        binding.cardResumeSimulation.visibility = View.VISIBLE
    }
}
