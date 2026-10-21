package com.tcc.vestibular.ui.home

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.tcc.vestibular.R
import com.tcc.vestibular.data.api.ApiClient
import com.tcc.vestibular.data.api.SessionManager
import com.tcc.vestibular.data.models.ActiveSimulationData
import com.tcc.vestibular.databinding.FragmentHomeBinding
import com.tcc.vestibular.ui.main.MainActivity
import com.tcc.vestibular.ui.simulation.CreateSimulationActivity
import com.tcc.vestibular.ui.simulation.SimulationExamActivity
import kotlinx.coroutines.launch

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private lateinit var sessionManager: SessionManager
    private var activeSimulation: ActiveSimulationData? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        sessionManager = SessionManager(requireContext())

        val userName = sessionManager.getUserName()
        if (userName.isNotEmpty()) {
            binding.tvHomeGreeting.text = "Olá, ${userName.split(" ").first()}!"
        }

        setupClickListeners()
    }

    override fun onResume() {
        super.onResume()
        checkActiveSimulation()
    }

    private fun setupClickListeners() {
        // Novo Simulado
        binding.cardHomeNewSim.setOnClickListener {
            val intent = Intent(requireContext(), CreateSimulationActivity::class.java)
            startActivity(intent)
        }

        // Banco de Questões -> Seleciona aba 2 no menu inferior
        binding.cardHomeQuestions.setOnClickListener {
            (activity as? MainActivity)?.selectTab(R.id.navigation_questions)
        }

        // Meu Perfil e Estatísticas -> Seleciona aba 3 no menu inferior
        binding.cardHomeProfile.setOnClickListener {
            (activity as? MainActivity)?.selectTab(R.id.navigation_profile)
        }

        // Continuar Simulado
        binding.btnHomeResumeSim.setOnClickListener {
            activeSimulation?.let { sim ->
                val intent = Intent(requireContext(), SimulationExamActivity::class.java).apply {
                    putExtra("EXTRA_SIMULATION_DATA", sim)
                }
                startActivity(intent)
            }
        }
    }

    private fun checkActiveSimulation() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(requireContext())
                val response = apiService.getActiveSimulation()

                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    if (body.active && body.simulation != null) {
                        activeSimulation = body.simulation
                        showResumeCard(body.simulation)
                    } else {
                        binding.cardHomeResumeSim.visibility = View.GONE
                        activeSimulation = null
                    }
                } else {
                    binding.cardHomeResumeSim.visibility = View.GONE
                }
            } catch (e: Exception) {
                binding.cardHomeResumeSim.visibility = View.GONE
            }
        }
    }

    private fun showResumeCard(sim: ActiveSimulationData) {
        val currentQuestionNumber = sim.currentQuestionIndex + 1
        binding.tvHomeResumeProgress.text = "Questão $currentQuestionNumber de ${sim.totalQuestions}"
        binding.tvHomeResumeTitle.text = sim.title
        binding.cardHomeResumeSim.visibility = View.VISIBLE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
