<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayrollSubmission;
use App\Models\Payslip;
use App\Models\PayrollLiability;
use App\Models\StarterForm;
use App\Models\P60P45;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class PayrollController extends Controller
{
    // ─── Payroll Submissions (Submit Hours) ───

    public function getSubmissions(Request $request)
    {
        $authUser = Auth::user();
        $userId = $request->user_id ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = PayrollSubmission::where('user_id', $userId);

        if ($request->has('year')) {
            $query->where('year', $request->year);
        }
        if ($request->has('month')) {
            $query->where('month', $request->month);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function submitHours(Request $request)
    {
        $authUser = Auth::user();

        $validated = $request->validate([
            'month' => 'required|string',
            'year' => 'required|string',
            'name' => 'nullable|string',
            'hours' => 'nullable|string',
            'holidays' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['user_id'] = $authUser->id;

        $submission = PayrollSubmission::create($validated);

        return response()->json([
            'message' => 'Payroll hours submitted successfully',
            'submission' => $submission,
        ]);
    }

    public function uploadEmployeePayslip(Request $request, $id)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'accountant') {
            return response()->json(['error' => 'Only accountants can upload payslips'], 403);
        }

        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $submission = PayrollSubmission::findOrFail($id);
        
        // Update user_id check? Accountant can upload for any client submission.
        
        $file = $request->file('file');
        // Store in a payslips folder
        $folder = 'payslips/' . $submission->user_id . '/' . $submission->year . '/' . $submission->month;
        $filename = $file->getClientOriginalName();
        $path = $file->storeAs($folder, Str::random(10) . '_' . $filename, 'public');

        $submission->update([
            'status' => 'processed',
            'payslip_file_path' => '/storage/' . $path,
            'payslip_filename' => $filename,
        ]);

        return response()->json($submission);
    }

    // ─── Payslips ───

    public function getPayslips(Request $request)
    {
        $authUser = Auth::user();
        $userId = $request->user_id ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = Payslip::where('user_id', $userId);

        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function uploadPayslip(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'accountant') {
            return response()->json(['error' => 'Only accountants can upload payslips'], 403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'month' => 'required|string',
            'year' => 'required|string',
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $folder = 'payslips/' . Str::uuid();
        $path = $file->storeAs($folder, $file->getClientOriginalName(), 'public');

        $payslip = Payslip::create([
            'user_id' => $request->user_id,
            'month' => $request->month,
            'year' => $request->year,
            'file_path' => '/storage/' . $path,
            'filename' => $file->getClientOriginalName(),
        ]);

        return response()->json($payslip);
    }

    // ─── Payroll Liabilities ───

    public function getLiabilities(Request $request)
    {
        $authUser = Auth::user();
        $userId = $request->user_id ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = PayrollLiability::where('user_id', $userId);

        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function storeLiability(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'accountant') {
            return response()->json(['error' => 'Only accountants can set liabilities'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'month' => 'required|string',
            'year' => 'required|string',
            'amount' => 'required|numeric',
            'payment_link' => 'nullable|string',
            'payment_reference' => 'nullable|string',
        ]);

        $liability = PayrollLiability::updateOrCreate(
            ['user_id' => $validated['user_id'], 'month' => $validated['month'], 'year' => $validated['year']],
            $validated
        );

        return response()->json($liability);
    }

    // ─── Starter Form ───

    public function getStarterForm(Request $request)
    {
        $authUser = Auth::user();
        $userId = $request->user_id ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $form = StarterForm::where('user_id', $userId)->latest()->first();

        return response()->json($form);
    }

    public function uploadStarterForm(Request $request)
    {
        $authUser = Auth::user();

        $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'file' => 'required|file|max:10240',
        ]);

        $targetUserId = $request->user_id ?? $authUser->id;

        $file = $request->file('file');
        $folder = 'starter_forms/' . Str::uuid();
        $path = $file->storeAs($folder, $file->getClientOriginalName(), 'public');

        $form = StarterForm::create([
            'user_id' => $targetUserId,
            'file_path' => '/storage/' . $path,
            'filename' => $file->getClientOriginalName(),
            'uploaded_by' => $authUser->id,
        ]);

        return response()->json($form);
    }

    // ─── P60s and P45s ───

    public function getP60P45(Request $request)
    {
        $authUser = Auth::user();
        $userId = $request->user_id ?? $authUser->id;

        if ($authUser->role !== 'accountant' && $authUser->id != $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = P60P45::where('user_id', $userId);

        if ($request->has('tax_year')) {
            $query->where('tax_year', $request->tax_year);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function uploadP60P45(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'accountant') {
            return response()->json(['error' => 'Only accountants can upload P60s/P45s'], 403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'tax_year' => 'required|string',
            'type' => 'required|in:p60,p45',
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $folder = 'p60_p45/' . Str::uuid();
        $path = $file->storeAs($folder, $file->getClientOriginalName(), 'public');

        $record = P60P45::create([
            'user_id' => $request->user_id,
            'tax_year' => $request->tax_year,
            'type' => $request->type,
            'file_path' => '/storage/' . $path,
            'filename' => $file->getClientOriginalName(),
        ]);

        return response()->json($record);
    }
}
