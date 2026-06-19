import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { 
  useListDepartments, 
  getListDepartmentsQueryKey 
} from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatRupiah } from "@/lib/format";

export default function DepartmentList() {
  const { data: departments, isLoading } = useListDepartments(undefined, {
    query: {
      queryKey: getListDepartmentsQueryKey()
    }
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Departemen</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Departemen
          </Button>
        </div>

        <div className="border rounded-md bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Departemen</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Memuat data departemen...
                  </TableCell>
                </TableRow>
              ) : !departments?.length ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Belum ada data departemen.
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{dept.description || "-"}</TableCell>
                    <TableCell>{new Date(dept.createdAt).toLocaleDateString("id-ID")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
