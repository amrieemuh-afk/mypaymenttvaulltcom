import { Layout } from "@/components/layout";
import { Link, useLocation, useParams } from "wouter";
import { 
  useGetEmployee, 
  getGetEmployeeQueryKey,
  useUpdateEmployee,
  useListDepartments,
  getListDepartmentsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  employeeCode: z.string().min(1, "Employee code is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  position: z.string().min(1, "Position is required"),
  departmentId: z.coerce.number().min(1, "Department is required"),
  baseSalary: z.coerce.number().min(0, "Base salary cannot be negative"),
  transportAllowance: z.coerce.number().min(0, "Transport allowance cannot be negative").optional(),
  mealAllowance: z.coerce.number().min(0, "Meal allowance cannot be negative").optional(),
  status: z.enum(["active", "inactive"]),
  joinDate: z.string().min(1, "Join date is required"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EditEmployee() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employee, isLoading } = useGetEmployee(id, {
    query: {
      enabled: !!id,
      queryKey: getGetEmployeeQueryKey(id)
    }
  });

  const { data: departments } = useListDepartments(undefined, {
    query: {
      queryKey: getListDepartmentsQueryKey()
    }
  });

  const updateEmployee = useUpdateEmployee();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      employeeCode: "",
      email: "",
      phone: "",
      position: "",
      departmentId: 0,
      baseSalary: 0,
      transportAllowance: 0,
      mealAllowance: 0,
      status: "active",
      joinDate: "",
    },
  });

  const initializedRef = useRef<number | null>(null);

  useEffect(() => {
    if (employee && initializedRef.current !== id) {
      initializedRef.current = id;
      form.reset({
        name: employee.name,
        employeeCode: employee.employeeCode,
        email: employee.email || "",
        phone: employee.phone || "",
        position: employee.position,
        departmentId: employee.departmentId,
        baseSalary: employee.baseSalary,
        transportAllowance: employee.transportAllowance || 0,
        mealAllowance: employee.mealAllowance || 0,
        status: employee.status as "active" | "inactive",
        joinDate: employee.joinDate ? employee.joinDate.split('T')[0] : "",
      });
    }
  }, [employee, id, form]);

  const onSubmit = (data: EmployeeFormValues) => {
    updateEmployee.mutate({ id, data }, {
      onSuccess: (updatedEmployee) => {
        toast({
          title: "Berhasil",
          description: "Data karyawan berhasil diperbarui",
        });
        queryClient.setQueryData(getGetEmployeeQueryKey(id), updatedEmployee);
      },
      onError: () => {
        toast({
          title: "Gagal",
          description: "Terjadi kesalahan saat memperbarui karyawan",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Karyawan tidak ditemukan</h2>
          <Link href="/karyawan" className="text-primary mt-4 inline-block hover:underline">
            Kembali ke daftar karyawan
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/karyawan">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Edit Karyawan</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Karyawan</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="employeeCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Karyawan</FormLabel>
                        <FormControl>
                          <Input placeholder="EMP001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Telepon</FormLabel>
                        <FormControl>
                          <Input placeholder="08123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departemen</FormLabel>
                        <Select 
                          onValueChange={(val) => field.onChange(Number(val))} 
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih departemen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments?.map((dept) => (
                              <SelectItem key={dept.id} value={String(dept.id)}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posisi/Jabatan</FormLabel>
                        <FormControl>
                          <Input placeholder="Staff IT" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="baseSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gaji Pokok (Rp)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportAllowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tunjangan Transport (Rp)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mealAllowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tunjangan Makan (Rp)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Nonaktif</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="joinDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Bergabung</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <Link href="/karyawan">
                    <Button type="button" variant="outline">Batal</Button>
                  </Link>
                  <Button type="submit" disabled={updateEmployee.isPending}>
                    {updateEmployee.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
