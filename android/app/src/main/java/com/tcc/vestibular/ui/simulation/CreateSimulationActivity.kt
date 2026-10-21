package com.tcc.vestibular.ui.simulation

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.tcc.vestibular.data.api.ApiClient
import com.tcc.vestibular.data.models.CreateSimulationRequest
import com.tcc.vestibular.data.models.Subject
import com.tcc.vestibular.data.models.Vestibular
import com.tcc.vestibular.databinding.ActivityCreateSimulationBinding
import kotlinx.coroutines.launch

class CreateSimulationActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCreateSimulationBinding
    private var subjectsList = listOf<Subject>()
    private var vestibularesList = listOf<Vestibular>()
    private var yearsList = listOf<Int>()
    private val countsList = listOf(10,25,45,90)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCreateSimulationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupQuestionCountSpinner()
        loadFilters()

        binding.btnStartSim.setOnClickListener {
            startSimulation()
        }
    }

    private fun setupQuestionCountSpinner() {
        val countLabels = countsList.map { "$it Questões" }
        binding.spSimQuestionsCount.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            countLabels
        )
        // Seleciona 10 questões por padrão (índice 0)
        binding.spSimQuestionsCount.setSelection(0)
    }

    private fun loadFilters() {
        lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(this@CreateSimulationActivity)

                // Matérias
                val subjectsResponse = apiService.getSubjects()
                if (subjectsResponse.isSuccessful) {
                    subjectsList = subjectsResponse.body() ?: emptyList()
                    val subjectNames = mutableListOf("Todas as Matérias")
                    subjectNames.addAll(subjectsList.map { it.name })
                    binding.spSimSubject.adapter = ArrayAdapter(
                        this@CreateSimulationActivity,
                        android.R.layout.simple_spinner_dropdown_item,
                        subjectNames
                    )
                }

                // Vestibulares
                val vestibularesResponse = apiService.getVestibulares()
                if (vestibularesResponse.isSuccessful) {
                    vestibularesList = vestibularesResponse.body() ?: emptyList()
                    val vestNames = mutableListOf("Todos os Vestibulares")
                    vestNames.addAll(vestibularesList.map { it.acronym })
                    binding.spSimVestibular.adapter = ArrayAdapter(
                        this@CreateSimulationActivity,
                        android.R.layout.simple_spinner_dropdown_item,
                        vestNames
                    )
                }

                // Anos
                val yearsResponse = apiService.getYears()
                if (yearsResponse.isSuccessful) {
                    yearsList = yearsResponse.body() ?: emptyList()
                    val yearLabels = mutableListOf("Todos os Anos")
                    yearLabels.addAll(yearsList.map { it.toString() })
                    binding.spSimYear.adapter = ArrayAdapter(
                        this@CreateSimulationActivity,
                        android.R.layout.simple_spinner_dropdown_item,
                        yearLabels
                    )
                }
            } catch (e: Exception) {
                Toast.makeText(this@CreateSimulationActivity, "Erro ao carregar filtros.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun startSimulation() {
        val selectedSubjectPos = binding.spSimSubject.selectedItemPosition
        val subjectId = if (selectedSubjectPos > 0 && selectedSubjectPos <= subjectsList.size) {
            subjectsList[selectedSubjectPos - 1].id
        } else null

        val selectedVestPos = binding.spSimVestibular.selectedItemPosition
        val vestId = if (selectedVestPos > 0 && selectedVestPos <= vestibularesList.size) {
            vestibularesList[selectedVestPos - 1].id
        } else null

        val selectedYearPos = binding.spSimYear.selectedItemPosition
        val year = if (selectedYearPos > 0 && selectedYearPos <= yearsList.size) {
            yearsList[selectedYearPos - 1]
        } else null

        val selectedCount = countsList[binding.spSimQuestionsCount.selectedItemPosition]
        val titleInput = binding.etSimTitle.text.toString().trim()
        val title = if (titleInput.isNotEmpty()) titleInput else null

        binding.pbCreatingSim.visibility = View.VISIBLE
        binding.btnStartSim.isEnabled = false

        lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(this@CreateSimulationActivity)
                val createResponse = apiService.createSimulation(
                    CreateSimulationRequest(
                        title = title,
                        subjectId = subjectId,
                        vestibularId = vestId,
                        year = year,
                        limit = selectedCount
                    )
                )

                if (createResponse.isSuccessful) {
                    // Após criar, busca o simulado ativo com as questões completas
                    val activeResponse = apiService.getActiveSimulation()
                    if (activeResponse.isSuccessful && activeResponse.body()?.simulation != null) {
                        val simData = activeResponse.body()!!.simulation!!
                        val intent = Intent(this@CreateSimulationActivity, SimulationExamActivity::class.java).apply {
                            putExtra("EXTRA_SIMULATION_DATA", simData)
                        }
                        startActivity(intent)
                        finish()
                    } else {
                        Toast.makeText(this@CreateSimulationActivity, "Simulado criado!", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                } else {
                    val serverError = try {
                        val errorJson = createResponse.errorBody()?.string()
                        val jsonObj = org.json.JSONObject(errorJson ?: "")
                        jsonObj.optString("error", "Não foi possível criar o simulado.")
                    } catch (e: Exception) {
                        "Erro ao iniciar simulado."
                    }
                    Toast.makeText(this@CreateSimulationActivity, serverError, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@CreateSimulationActivity, "Erro: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                binding.pbCreatingSim.visibility = View.GONE
                binding.btnStartSim.isEnabled = true
            }
        }
    }
}
