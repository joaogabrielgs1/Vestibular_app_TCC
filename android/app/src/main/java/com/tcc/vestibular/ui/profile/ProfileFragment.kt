package com.tcc.vestibular.ui.profile

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.tcc.vestibular.R
import com.tcc.vestibular.data.api.ApiClient
import com.tcc.vestibular.data.api.SessionManager
import com.tcc.vestibular.databinding.FragmentProfileBinding
import com.tcc.vestibular.ui.auth.LoginActivity
import kotlinx.coroutines.launch

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    private lateinit var statsAdapter: SubjectStatsAdapter
    private lateinit var sessionManager: SessionManager

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        sessionManager = SessionManager(requireContext())

        binding.tvProfileName.text = sessionManager.getUserName()
        binding.tvProfileEmail.text = sessionManager.getUserEmail()

        setupRecyclerView()
        loadProfileData()

        binding.btnChangeEmail.setOnClickListener {
            showChangeEmailDialog()
        }

        binding.btnChangePassword.setOnClickListener {
            showChangePasswordDialog()
        }

        binding.btnDeleteAccount.setOnClickListener {
            showDeleteAccountDialog()
        }

        binding.btnLogout.setOnClickListener {
            logoutUser()
        }
    }

    private fun logoutUser() {
        sessionManager.clearSession()
        val intent = Intent(requireContext(), LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        requireActivity().finish()
    }

    private fun showChangeEmailDialog() {
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_update_email, null)
        val etNewEmail = dialogView.findViewById<com.google.android.material.textfield.TextInputEditText>(R.id.etNewEmail)
        val etCurrentPassword = dialogView.findViewById<com.google.android.material.textfield.TextInputEditText>(R.id.etCurrentPasswordEmail)

        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .setPositiveButton("Salvar Novo E-mail") { _, _ ->
                val newEmail = etNewEmail.text.toString().trim()
                val currentPassword = etCurrentPassword.text.toString().trim()

                if (newEmail.isEmpty() || currentPassword.isEmpty()) {
                    Toast.makeText(requireContext(), "Preencha todos os campos.", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                viewLifecycleOwner.lifecycleScope.launch {
                    try {
                        val apiService = ApiClient.getService(requireContext())
                        val response = apiService.updateEmail(
                            com.tcc.vestibular.data.models.UpdateEmailRequest(
                                currentPassword = currentPassword,
                                newEmail = newEmail
                            )
                        )

                        if (response.isSuccessful) {
                            sessionManager.saveUserData(
                                sessionManager.getUserId(),
                                sessionManager.getUserName(),
                                newEmail
                            )
                            binding.tvProfileEmail.text = newEmail
                            Toast.makeText(requireContext(), "E-mail alterado com sucesso!", Toast.LENGTH_LONG).show()
                        } else {
                            val errorMsg = extractErrorMessage(response.errorBody()?.string(), "Erro ao alterar e-mail.")
                            Toast.makeText(requireContext(), errorMsg, Toast.LENGTH_LONG).show()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(requireContext(), "Erro de conexão: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun showChangePasswordDialog() {
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_update_password, null)
        val etCurrentPassword = dialogView.findViewById<com.google.android.material.textfield.TextInputEditText>(R.id.etCurrentPassword)
        val etNewPassword = dialogView.findViewById<com.google.android.material.textfield.TextInputEditText>(R.id.etNewPassword)
        val etConfirmNewPassword = dialogView.findViewById<com.google.android.material.textfield.TextInputEditText>(R.id.etConfirmNewPassword)

        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .setPositiveButton("Salvar Nova Senha") { _, _ ->
                val currentPassword = etCurrentPassword.text.toString().trim()
                val newPassword = etNewPassword.text.toString().trim()
                val confirmPassword = etConfirmNewPassword.text.toString().trim()

                if (currentPassword.isEmpty() || newPassword.isEmpty() || confirmPassword.isEmpty()) {
                    Toast.makeText(requireContext(), "Preencha todos os campos.", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                if (newPassword.length < 6) {
                    Toast.makeText(requireContext(), "A nova senha deve ter no mínimo 6 caracteres.", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                if (newPassword != confirmPassword) {
                    Toast.makeText(requireContext(), "A nova senha e a confirmação não conferem.", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                viewLifecycleOwner.lifecycleScope.launch {
                    try {
                        val apiService = ApiClient.getService(requireContext())
                        val response = apiService.updatePassword(
                            com.tcc.vestibular.data.models.UpdatePasswordRequest(
                                currentPassword = currentPassword,
                                newPassword = newPassword,
                                confirmPassword = confirmPassword
                            )
                        )

                        if (response.isSuccessful) {
                            Toast.makeText(requireContext(), "Senha alterada com sucesso!", Toast.LENGTH_LONG).show()
                        } else {
                            val errorMsg = extractErrorMessage(response.errorBody()?.string(), "Erro ao alterar senha.")
                            Toast.makeText(requireContext(), errorMsg, Toast.LENGTH_LONG).show()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(requireContext(), "Erro de conexão: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun showDeleteAccountDialog() {
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_delete_account, null)
        val etDeletePassword = dialogView.findViewById<com.google.android.material.textfield.TextInputEditText>(R.id.etDeletePassword)

        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .setPositiveButton("Sim, Excluir Minha Conta") { _, _ ->
                val password = etDeletePassword.text.toString().trim()

                if (password.isEmpty()) {
                    Toast.makeText(requireContext(), "Digite sua senha para confirmar a exclusão.", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                viewLifecycleOwner.lifecycleScope.launch {
                    try {
                        val apiService = ApiClient.getService(requireContext())
                        val response = apiService.deleteAccount(
                            com.tcc.vestibular.data.models.DeleteAccountRequest(password = password)
                        )

                        if (response.isSuccessful) {
                            Toast.makeText(requireContext(), "Conta excluída com sucesso.", Toast.LENGTH_LONG).show()
                            logoutUser()
                        } else {
                            val errorMsg = extractErrorMessage(response.errorBody()?.string(), "Senha incorreta. Não foi possível excluir a conta.")
                            Toast.makeText(requireContext(), errorMsg, Toast.LENGTH_LONG).show()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(requireContext(), "Erro de conexão: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun extractErrorMessage(errorJson: String?, defaultMsg: String): String {
        return try {
            val jsonObj = org.json.JSONObject(errorJson ?: "")
            jsonObj.optString("error", defaultMsg)
        } catch (e: Exception) {
            defaultMsg
        }
    }

    private fun setupRecyclerView() {
        statsAdapter = SubjectStatsAdapter { stat ->
            val intent = Intent(requireContext(), SubjectDetailActivity::class.java).apply {
                putExtra("EXTRA_SUBJECT_ID", stat.subjectId)
                putExtra("EXTRA_SUBJECT_NAME", stat.subjectName)
            }
            startActivity(intent)
        }
        binding.rvSubjectStats.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = statsAdapter
        }
    }

    private fun loadProfileData() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(requireContext())

                // 1. Carrega dados do perfil atualizado
                val profileResponse = apiService.getProfile()
                if (profileResponse.isSuccessful && profileResponse.body() != null) {
                    val profile = profileResponse.body()!!
                    binding.tvProfileName.text = profile.fullName
                    binding.tvProfileEmail.text = profile.email
                }

                // 2. Carrega estatísticas e métricas de desempenho
                val statsResponse = apiService.getStatistics()
                if (statsResponse.isSuccessful && statsResponse.body() != null) {
                    val stats = statsResponse.body()!!

                    binding.tvStatTotal.text = stats.overview.totalAnswered.toString()
                    binding.tvStatCorrect.text = stats.overview.totalCorrect.toString()
                    binding.tvStatPercentage.text = "${stats.overview.accuracyPercentage}%"

                    statsAdapter.setStats(stats.bySubject)
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Erro ao carregar estatísticas: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
