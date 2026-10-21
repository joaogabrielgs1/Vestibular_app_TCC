package com.tcc.vestibular.ui.simulation

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.tcc.vestibular.data.models.SimulationResultData
import com.tcc.vestibular.databinding.ActivitySimulationResultBinding
import com.tcc.vestibular.ui.main.MainActivity

class SimulationResultActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySimulationResultBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySimulationResultBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val resultData = intent.getSerializableExtra("EXTRA_SIMULATION_RESULT") as? SimulationResultData
        if (resultData == null) {
            Toast.makeText(this, "Não foi possível exibir o resultado.", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        renderResult(resultData)

        binding.btnBackToHome.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            startActivity(intent)
            finish()
        }
    }

    private fun renderResult(data: SimulationResultData) {
        binding.tvResultExamTitle.text = data.title
        binding.tvResultTotal.text = data.totalQuestions.toString()
        binding.tvResultCorrect.text = data.totalCorrect.toString()
        binding.tvResultWrong.text = data.totalWrong.toString()
        binding.tvResultPercentage.text = "${data.accuracyPercentage}%"

        binding.rvSimulationReview.apply {
            layoutManager = LinearLayoutManager(this@SimulationResultActivity)
            adapter = SimulationQuestionReviewAdapter(data.questions)
        }
    }
}
